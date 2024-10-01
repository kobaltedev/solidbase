import type { SolidStartInlineConfig } from "@solidjs/start/config";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";

export type SolidBaseConfig = {};

export function withSolidBase(
	startConfig?: SolidStartInlineConfig,
	solidBaseConfig?: SolidBaseConfig,
) {
	const config = startConfig ?? {};

	process.env.PORT ??= "4000";

	config.extensions = [
		...new Set((config.extensions ?? []).concat(["md", "mdx"])),
	];

	const vite = config.vite;
	config.vite = (options) => {
		const viteConfig =
			typeof vite === "function" ? vite(options) : (vite ?? {});

		viteConfig.plugins ??= [];
		viteConfig.plugins.push(
			mdx.default.withImports({})({
				jsx: true,
				jsxImportSource: "solid-js",
				providerImportSource: "solid-mdx",
			}),
		);

		return viteConfig;
	};

	return config;
}
