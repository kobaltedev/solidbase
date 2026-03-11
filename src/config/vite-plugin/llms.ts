import type { PluginOption } from "vite";

import type { SolidBaseResolvedConfig } from "../index.js";
import { buildLlmsIndex, getLlmDocuments } from "../llms-index.js";

export default function solidBaseLlmsPlugin(
	config: SolidBaseResolvedConfig<any>,
): PluginOption {
	if (!config.llms) return [];

	let root = process.cwd();

	return {
		name: "solidbase:llms",
		configResolved(resolvedConfig) {
			root = resolvedConfig.root;
		},
		async generateBundle() {
			const documents = await getLlmDocuments(root, config);

			this.emitFile({
				type: "asset",
				fileName: "llms.txt",
				source: buildLlmsIndex(undefined, config, documents),
			});

			for (const document of documents) {
				this.emitFile({
					type: "asset",
					fileName: document.markdownPath.slice(1),
					source: document.content,
				});
			}
		},
	};
}
