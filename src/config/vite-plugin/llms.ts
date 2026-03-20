import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { PluginOption } from "vite";

import type { SolidBaseResolvedConfig } from "../index.js";
import { buildLlmsIndex, getLlmDocuments } from "../llms-index.js";
import { createGeneratedAssetPlugin, emptyDir } from "./generated-asset.js";

const LLMS_PUBLIC_ASSETS_DIR = join("node_modules", ".solidbase", "llms");

async function writeLlmsAssets(
	root: string,
	config: SolidBaseResolvedConfig<any>,
	resolver: (
		source: string,
		importer: string,
	) => Promise<{ id: string } | null>,
) {
	const documents = await getLlmDocuments(root, config, resolver);
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

	return createGeneratedAssetPlugin({
		name: "solidbase:llms",
		apply: "build",
		assetDir: LLMS_PUBLIC_ASSETS_DIR,
		watchRoutes: true,
		write(root, resolver) {
			return writeLlmsAssets(root, config, resolver);
		},
	});
}
