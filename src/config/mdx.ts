import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { nodeTypes } from "@mdx-js/mdx";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode, {
	type ExpressiveCodeTheme,
} from "rehype-expressive-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

import type { SolidBaseResolvedConfig } from ".";
import { rehypeFixExpressiveCodeJsx } from "./rehype-plugins";
import {
	remarkAddClass,
	remarkDirectiveContainers,
	remarkGithubAlertsToDirectives,
	remarkIssueAutolink,
	remarkRelativeImports,
	remarkTOC,
} from "./remark-plugins";

export function solidBaseMdx(sbConfig: SolidBaseResolvedConfig<any>) {
	return mdx.default.withImports({})({
		jsx: true,
		jsxImportSource: "solid-js",
		providerImportSource: "solid-mdx",
		stylePropertyNameCase: "css",
		rehypePlugins: [
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
					...sbConfig.markdown?.expressiveCode,
				},
			],
			rehypeFixExpressiveCodeJsx,
			...(sbConfig.markdown?.rehypePlugins ?? []),
		],
		remarkPlugins: [
			remarkFrontmatter,
			remarkMdxFrontmatter,
			remarkGfm,
			remarkGithubAlertsToDirectives,
			remarkDirective,
			remarkRelativeImports,
			remarkTOC,
			remarkDirectiveContainers,
			remarkAddClass,
			[remarkIssueAutolink, sbConfig.issueAutolink],
			...(sbConfig.markdown?.remarkPlugins ?? []),
		],
	});
}
