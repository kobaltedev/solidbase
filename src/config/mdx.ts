import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { nodeTypes } from "@mdx-js/mdx";
import type { PluginTwoslashOptions } from "expressive-code-twoslash";
import ecTwoSlash from "expressive-code-twoslash";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode, {
	type ExpressiveCodePlugin,
	type ExpressiveCodeTheme,
	type RehypeExpressiveCodeOptions,
} from "rehype-expressive-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { convertCompilerOptionsFromJson } from "typescript";
import type { PluggableList } from "unified";
import type { PluginOption } from "vite";

import mdx from "../vite-mdx/index.js";
import {
	type EcPluginLanguageSwitcherOptions,
	ecPluginLanguageSwitcher,
} from "./ec-plugins/language-switcher/index.js";
import type { SolidBaseResolvedConfig } from "./index.js";
import { rehypeFixExpressiveCodeJsx } from "./rehype-plugins/fix-expressive-code.js";
import { remarkCodeTabs } from "./remark-plugins/code-tabs.js";
import { remarkDirectiveContainers } from "./remark-plugins/directives.js";
import { remarkGithubAlertsToDirectives } from "./remark-plugins/gh-directives.js";
import {
	type ImportCodeFileOptions,
	remarkImportCodeFile,
	viteAliasCodeImports,
} from "./remark-plugins/import-code-file.js";
import { remarkInlineFrontmatter } from "./remark-plugins/inline-frontmatter.js";
import { remarkIssueAutolink } from "./remark-plugins/issue-autolink.js";
import { remarkAddClass } from "./remark-plugins/kbd.js";
import { remarkMdxFrontmatter } from "./remark-plugins/mdx-frontmatter.js";
import type { PackageManagerConfig } from "./remark-plugins/package-manager-tabs.js";
import { remarkPackageManagerTabs } from "./remark-plugins/package-manager-tabs.js";
import { remarkRelativeImports } from "./remark-plugins/relative-imports.js";
import { remarkSteps } from "./remark-plugins/steps.js";
import { remarkTabGroup } from "./remark-plugins/tab-group.js";
import type { TOCOptions } from "./remark-plugins/toc.js";
import { remarkTOC } from "./remark-plugins/toc.js";

export type TwoslashOptions = PluginTwoslashOptions & { tsconfig: any };

export interface MdxOptions {
	expressiveCode?:
		| (RehypeExpressiveCodeOptions & {
				twoSlash?: TwoslashOptions | true;
				languageSwitcher?: EcPluginLanguageSwitcherOptions | true;
		  })
		| false;
	toc?: TOCOptions | false;
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
	packageManagers?: PackageManagerConfig | false;
	importCodeFile?: ImportCodeFileOptions | false;
	steps?: false;
}

export function solidBaseMdx(
	sbConfig: SolidBaseResolvedConfig<any>,
): PluginOption {
	return [
		viteAliasCodeImports(),
		mdx.withImports({})({
			jsx: true,
			jsxImportSource: "solid-js",
			providerImportSource: "@kobalte/solidbase/solid-mdx",
			stylePropertyNameCase: "css",
			rehypePlugins: getRehypePlugins(sbConfig),
			remarkPlugins: getRemarkPlugins(sbConfig),
		}),
	];
}

function getRehypePlugins(sbConfig: SolidBaseResolvedConfig<any>) {
	const rehypePlugins: any[] = [];

	if (sbConfig.markdown?.expressiveCode !== false) {
		const plugins: (ExpressiveCodePlugin | ExpressiveCodePlugin[])[] = [
			pluginLineNumbers(),
			pluginCollapsibleSections(),
		];

		if (sbConfig.markdown?.expressiveCode?.twoSlash) {
			const twoSlash =
				sbConfig.markdown.expressiveCode.twoSlash === true
					? ({} as TwoslashOptions)
					: sbConfig.markdown.expressiveCode.twoSlash;
			plugins.push(
				ecTwoSlash({
					...twoSlash,
					twoslashOptions: {
						...twoSlash.twoslashOptions,
						compilerOptions: {
							...convertCompilerOptionsFromJson(
								{
									allowSyntheticDefaultImports: true,
									esModuleInterop: true,
									target: "ESNext",
									module: "ESNext",
									lib: ["dom", "esnext"],
									jsxImportSource: "solid-js",
									jsx: "preserve",
									...twoSlash.tsconfig,
								},
								".",
							).options,
							...twoSlash.twoslashOptions?.compilerOptions,
						},
					},
				}),
			);
		}

		if (sbConfig.markdown?.expressiveCode?.languageSwitcher) {
			const config =
				sbConfig.markdown.expressiveCode.languageSwitcher === true
					? {}
					: sbConfig.markdown.expressiveCode?.languageSwitcher;

			plugins.push(ecPluginLanguageSwitcher(config));
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
	const remarkPlugins: any[] = [];

	if (sbConfig.markdown?.steps !== false) remarkPlugins.push(remarkSteps);

	const expressiveCodeConfig = sbConfig.markdown?.expressiveCode;
	const languageSwitcherConfig = expressiveCodeConfig
		? expressiveCodeConfig.languageSwitcher
		: {};
	const isLanguageSwitcherDisabled =
		!languageSwitcherConfig ||
		(languageSwitcherConfig !== true &&
			!(languageSwitcherConfig.showToggleButton ?? true));
	const withTsJsToggle = !!expressiveCodeConfig && !isLanguageSwitcherDisabled;

	remarkPlugins.push(
		remarkFrontmatter,
		remarkMdxFrontmatter,
		remarkInlineFrontmatter,
		[remarkImportCodeFile, sbConfig.markdown?.importCodeFile],
		remarkGfm,
		remarkGithubAlertsToDirectives,
		[
			remarkCodeTabs,
			{
				withTsJsToggle,
			},
		],
		[remarkPackageManagerTabs, sbConfig.markdown?.packageManagers ?? {}],
		[
			remarkTabGroup,
			languageSwitcherConfig === true ? {} : languageSwitcherConfig,
		],
		remarkDirective,
		remarkRelativeImports,
	);

	if (sbConfig.markdown?.toc !== false)
		remarkPlugins.push([remarkTOC, sbConfig.markdown?.toc]);

	remarkPlugins.push(remarkDirectiveContainers, remarkAddClass);

	if (sbConfig.issueAutolink !== false)
		remarkPlugins.push([remarkIssueAutolink, sbConfig.issueAutolink]);

	remarkPlugins.push(...(sbConfig.markdown?.remarkPlugins ?? []));

	return remarkPlugins;
}
