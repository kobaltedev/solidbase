import { glob } from "glob";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir } from "node:fs/promises";

const filePath = fileURLToPath(import.meta.url);
const repoPath = join(dirname(filePath), "../");
const distPath = join(repoPath, "dist");

async function main() {
  const nonSourceFiles = await glob("**/*.*", {
    cwd: join(repoPath, "src"),
    ignore: "**/*.ts*",
  });

  for (const file of nonSourceFiles) {
    const src = join(repoPath, "src", file);
    const dest = join(distPath, file);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
  }
}

main();
