import type {
	SolidStartInlineConfig,
	ViteCustomizableConfig,
} from "@solidjs/start/config";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeExpressiveCode, {
	ExpressiveCodeTheme,
} from "rehype-expressive-code";
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import rehypeSlug from 'rehype-slug'
import rehypeAutoLinkHeadings from "rehype-autolink-headings";

import solidBaseVitePlugin from "./vite-plugin";
import {remarkTOC} from "./remark-plugins";

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
					remarkGfm,
					remarkTOC,
				],
			}),
		);

		viteConfig.plugins.push(solidBaseVitePlugin(config, baseConfig));

		return viteConfig;
	};

	return config;
}