import type { SolidStartInlineConfig } from "@solidjs/start/config";
import type { PluginOption } from "vite";

import type { SolidBaseConfig } from "../config";
import { loadVirtual } from "./virtual";

const virtualModuleId = "virtual:solidbase";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

export default function solidBaseVitePlugin(
	startConfig: SolidStartInlineConfig,
	solidBaseConfig: SolidBaseConfig,
): PluginOption {
	return {
		name: "solidbase",
		enforce: "pre",
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id) {
			if (id === resolvedVirtualModuleId) {
				return loadVirtual(startConfig, solidBaseConfig);
			}
		},
	};
}
