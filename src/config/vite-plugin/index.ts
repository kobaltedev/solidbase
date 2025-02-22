import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SolidStartInlineConfig } from "@solidjs/start/config";
import type { PluginOption } from "vite";

import type { SolidBaseConfig, ThemeDefinition } from "../index.js";
import {
	componentsModule,
	configModule,
	transformMdxModule,
} from "./virtual.js";

export default function solidBaseVitePlugin(
	theme: ThemeDefinition<any>,
	startConfig: SolidStartInlineConfig,
	solidBaseConfig: Partial<SolidBaseConfig<any>>,
): PluginOption {
	return [
		{
			name: "solidbase:pre",
			enforce: "pre",
			resolveId(id) {
				if (id === configModule.id) return configModule.resolvedId;
				else if (id === componentsModule.id) return componentsModule.resolvedId;
			},
			async load(id) {
				if (id === configModule.resolvedId)
					return configModule.load(solidBaseConfig);
				else if (id === componentsModule.resolvedId)
					return await componentsModule.load(theme);
			},
			transform(code, id) {
				if (isMarkdown(id)) {
					return code.replaceAll(
						/="(\$\$SolidBase_RelativeImport\d+)"/gm,
						(_, ident) => `={${ident}}`,
					);
				}
			},
		},
		{
			name: "solidbase:post",
			enforce: "post",
			transform(code, id) {
				if (
					id.startsWith(dirname(fileURLToPath(import.meta.url))) &&
					isMarkdown(id)
				)
					return transformMdxModule(code, id, startConfig, solidBaseConfig);
			},
		},
	];
}

export function isMarkdown(path: string) {
	return !!path.match(/\.(mdx|md)/gm);
}
