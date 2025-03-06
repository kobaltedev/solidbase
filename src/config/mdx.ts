import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { nodeTypes } from "@mdx-js/mdx";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";
import ecTwoSlash from "expressive-code-twoslash";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode, {
	type RehypeExpressiveCodeOptions,
	type ExpressiveCodeTheme,
} from "rehype-expressive-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { convertCompilerOptionsFromJson } from "typescript";

import type { SolidBaseResolvedConfig } from "./index.js";
import { rehypeFixExpressiveCodeJsx } from "./rehype-plugins.js";
import {
	remarkAddClass,
	remarkDirectiveContainers,
	remarkGithubAlertsToDirectives,
	remarkIssueAutolink,
	remarkRelativeImports,
	remarkTOC,
} from "./remark-plugins.js";

export function solidBaseMdx(sbConfig: SolidBaseResolvedConfig<any>) {
	return mdx.default.withImports({})({
		jsx: true,
		jsxImportSource: "solid-js",
		providerImportSource: "solid-mdx",
		stylePropertyNameCase: "css",
		rehypePlugins: [
			[
				rehypeExpressiveCode,
				{
					themes: ["github-dark", "github-light"],
					themeCssSelector: (theme: ExpressiveCodeTheme) =>
						`[data-theme="${theme.type}"]`,
					plugins: [
						pluginLineNumbers(),
						pluginCollapsibleSections(),
						ecTwoSlash({
							twoslashOptions: {
								compilerOptions: convertCompilerOptionsFromJson(
									{
										allowSyntheticDefaultImports: true,
										esModuleInterop: true,
										target: "ESNext",
										module: "ESNext",
										lib: ["dom", "esnext"],
										jsxImportSource: "solid-js",
										jsx: "preserve",
									},
									".",
								).options,
							},
						}),
					],
					defaultProps: {
						showLineNumbers: false,
						collapseStyle: "collapsible-auto",
					},
					...sbConfig.markdown?.expressiveCode,
				} satisfies RehypeExpressiveCodeOptions,
			],
			rehypeFixExpressiveCodeJsx,
			[rehypeRaw, { passThrough: nodeTypes }],
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
			...(sbConfig.markdown?.rehypePlugins ?? []),
		],
		remarkPlugins: [
			remarkFrontmatter,
			remarkMdxFrontmatter,
			remarkGfm,
			remarkGithubAlertsToDirectives,
			remarkDirective,
			remarkRelativeImports,
			[remarkTOC, sbConfig.markdown?.toc],
			remarkDirectiveContainers,
			remarkAddClass,
			[remarkIssueAutolink, sbConfig.issueAutolink],
			...(sbConfig.markdown?.remarkPlugins ?? []),
		],
	});
}
