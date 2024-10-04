import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import type {
	SolidStartInlineConfig,
	ViteCustomizableConfig,
} from "@solidjs/start/config";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode, {
	type ExpressiveCodeTheme,
} from "rehype-expressive-code";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

import {
	remarkCustomContainers,
	remarkGithubAlertsToDirectives,
	remarkTOC,
} from "./remark-plugins";
import solidBaseVitePlugin from "./vite-plugin";

export type SolidBaseConfig = {
	title?: string;
	description?: string;
	componentsFolder?: string;
};

export function withSolidBase(
	startConfig?: SolidStartInlineConfig,
	solidBaseConfig?: SolidBaseConfig,
) {
	const config = startConfig ?? {};
	const baseConfig = solidBaseConfig ?? {};

	process.env.PORT ??= "4000";

	config.extensions = [
		...new Set((config.extensions ?? []).concat(["md", "mdx"])),
	];

	const vite = config.vite;
	config.vite = (options) => {
		const viteConfig =
			typeof vite === "function"
				? vite(options)
				: ((vite ?? {}) as ViteCustomizableConfig);

		viteConfig.plugins ??= [];
		viteConfig.plugins.push(
			mdx.default.withImports({})({
				jsx: true,
				jsxImportSource: "solid-js",
				providerImportSource: "solid-mdx",
				rehypePlugins: [
					rehypeSlug,
					[
						rehypeAutoLinkHeadings,
						{
							behavior: "wrap",
							properties: {
								"data-auto-heading": "",
							},
						},
					],
					[
						rehypeExpressiveCode,
						{
							themes: ["github-dark", "github-light"],
							themeCSSSelector: (theme: ExpressiveCodeTheme) =>
								`[data-theme="${theme.name.split("-")[1]}"]`,
							plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
							defaultProps: {
								showLineNumbers: false,
							},
						},
					],
				],
				remarkPlugins: [
					remarkFrontmatter,
					remarkMdxFrontmatter,
					remarkGithubAlertsToDirectives,
					remarkDirective,
					remarkGfm,
					remarkTOC,
					remarkCustomContainers,
				],
			}),
		);

		viteConfig.plugins.push(solidBaseVitePlugin(config, baseConfig));

		return viteConfig;
	};

	return config;
}
