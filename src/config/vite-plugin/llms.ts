import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";

import type { PluginOption } from "vite";

import type { SolidBaseResolvedConfig } from "../index.js";
import { buildLlmsIndex, getLlmDocuments } from "../llms-index.js";

const LLMS_PUBLIC_ASSETS_DIR = join("node_modules", ".solidbase", "llms");

async function emptyDir(dir: string) {
	await rm(dir, { recursive: true, force: true });
	await mkdir(dir, { recursive: true });
}

async function writeLlmsAssets(
	root: string,
	config: SolidBaseResolvedConfig<any>,
) {
	const documents = await getLlmDocuments(root, config);
	const outputDir = join(root, LLMS_PUBLIC_ASSETS_DIR);

	await emptyDir(outputDir);
	await writeFile(
		join(outputDir, "llms.txt"),
		buildLlmsIndex(undefined, config, documents),
		"utf8",
	);

	await Promise.all(
		documents.map(async (document) => {
			const filePath = join(outputDir, document.markdownPath.slice(1));

			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, document.content, "utf8");
		}),
	);
}

export default function solidBaseLlmsPlugin(
	config: SolidBaseResolvedConfig<any>,
): PluginOption {
	if (!config.llms) return [];

	let root = process.cwd();

	return {
		name: "solidbase:llms",
		config(viteConfig) {
			const nitroConfig = (viteConfig as any).nitro ?? {};

			return {
				nitro: {
					...nitroConfig,
					publicAssets: [
						...(nitroConfig.publicAssets ?? []),
						{
							dir: LLMS_PUBLIC_ASSETS_DIR,
							baseURL: "/",
							fallthrough: true,
							ignore: false,
						},
					],
				},
			} as any;
		},
		configResolved(resolvedConfig) {
			root = resolvedConfig.root;
		},
		async buildStart() {
			await writeLlmsAssets(root, config);
		},
		async handleHotUpdate(ctx) {
			if (!ctx.file.includes(`${sep}src${sep}routes${sep}`)) {
				return;
			}

			await writeLlmsAssets(root, config);
		},
	};
}
