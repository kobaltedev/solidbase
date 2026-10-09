import * as fs from "node:fs/promises";
import { glob } from "node:fs/promises";
import * as path from "node:path";

const files = await Array.fromAsync(
	glob("**/*.{js,mjs,css}", { cwd: `${process.cwd()}/src` }),
);

await Promise.all(
	files.map((file) =>
		fs.cp(
			path.join(import.meta.dirname, "../src", file),
			path.join(import.meta.dirname, "../dist", file),
			{ recursive: true },
		),
	),
);
