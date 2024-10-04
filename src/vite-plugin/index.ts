import type { SolidStartInlineConfig } from "@solidjs/start/config";
import type { PluginOption } from "vite";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SolidBaseConfig } from "../config";
import { loadVirtual, transformMdxModule } from "./virtual";

const virtualModuleId = "virtual:solidbase";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

export default function solidBaseVitePlugin(
	startConfig: SolidStartInlineConfig,
	solidBaseConfig: SolidBaseConfig,
): PluginOption {
	return [
		{
			name: "solidbase:pre",
			enforce: "pre",
			resolveId(id) {
				if (id === virtualModuleId) {
					return resolvedVirtualModuleId;
				}
			},
			async load(id) {
				// console.log("vite load", id);
				if (id === resolvedVirtualModuleId) {
					return loadVirtual(startConfig, solidBaseConfig);
				}
			},
		},
		{
			name: "solidbase:post",
			enforce: "post",
			transform(code, id) {
				// console.log("vite transform", id);

				if (
					id.startsWith(dirname(fileURLToPath(import.meta.url))) &&
					id.includes(".mdx")
				)
					return transformMdxModule(code, id);
			},
		},
	];
}
