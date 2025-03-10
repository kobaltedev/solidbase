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
	type ExpressiveCodePlugin,
} from "rehype-expressive-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { convertCompilerOptionsFromJson } from "typescript";

import type { SolidBaseResolvedConfig } from "./index.js";
import { rehypeFixExpressiveCodeJsx } from "./rehype-plugins/fix-expressive-code.js";
import { remarkCodeTabs } from "./remark-plugins/code-tabs.js";
import { remarkDirectiveContainers } from "./remark-plugins/directives.js";
import { remarkGithubAlertsToDirectives } from "./remark-plugins/gh-directives.js";
import { remarkIssueAutolink } from "./remark-plugins/issue-autolink.js";
import { remarkAddClass } from "./remark-plugins/kbd.js";
import { remarkRelativeImports } from "./remark-plugins/relative-imports";
import { remarkTabGroup } from "./remark-plugins/tab-group";
import { remarkTOC } from "./remark-plugins/toc.js";

export function solidBaseMdx(sbConfig: SolidBaseResolvedConfig<any>) {
	return mdx.default.withImports({})({
		jsx: true,
		jsxImportSource: "solid-js",
		providerImportSource: "solid-mdx",
		stylePropertyNameCase: "css",
		rehypePlugins: getRehypePlugins(sbConfig),
		remarkPlugins: getRemarkPlugins(sbConfig),
	});
}

function getRehypePlugins(sbConfig: SolidBaseResolvedConfig<any>) {
	const rehypePlugins: any[] = [];

	if (sbConfig.markdown?.expressiveCode !== false) {
		const plugins: (ExpressiveCodePlugin | ExpressiveCodePlugin[])[] = [
			pluginLineNumbers(),
			pluginCollapsibleSections(),
		];

		if (sbConfig.markdown?.expressiveCode?.twoSlash !== false) {
			plugins.push(
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
					...sbConfig.markdown?.expressiveCode?.twoSlash,
				}),
			);
		}

		rehypePlugins.push(
			[
				rehypeExpressiveCode,
				{
					themes: ["github-dark", "github-light"],
					themeCssSelector: (theme: ExpressiveCodeTheme) =>
						`[data-theme="${theme.type}"]`,
					plugins,
					defaultProps: {
						showLineNumbers: false,
						collapseStyle: "collapsible-auto",
					},
					...sbConfig.markdown?.expressiveCode,
				} satisfies RehypeExpressiveCodeOptions,
			],
			rehypeFixExpressiveCodeJsx,
		);
	}

	rehypePlugins.push(
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
	);

	return rehypePlugins;
}

function getRemarkPlugins(sbConfig: SolidBaseResolvedConfig<any>) {
	const remarkPlugins: any[] = [
		remarkFrontmatter,
		remarkMdxFrontmatter,
		remarkGfm,
		remarkGithubAlertsToDirectives,
		remarkCodeTabs,
		remarkTabGroup,
		remarkDirective,
		remarkRelativeImports,
	];

	if (sbConfig.markdown?.toc !== false)
		remarkPlugins.push([remarkTOC, sbConfig.markdown?.toc]);

	remarkPlugins.push(remarkDirectiveContainers, remarkAddClass);

	if (sbConfig.issueAutolink !== false)
		remarkPlugins.push([remarkIssueAutolink, sbConfig.issueAutolink]);

	remarkPlugins.push(...(sbConfig.markdown?.remarkPlugins ?? []));

	return remarkPlugins;
}
