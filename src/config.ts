import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { nodeTypes } from "@mdx-js/mdx";
import type {
	SolidStartInlineConfig,
	ViteCustomizableConfig,
} from "@solidjs/start/config";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

import rehypeExpressiveCode, {
	type ExpressiveCodeTheme,
} from "rehype-expressive-code";
import type { SearchConfig } from "./client/search";
import { rehypeFixExpressiveCodeJsx } from "./rehype-plugins";
import {
	remarkCustomContainers,
	remarkGithubAlertsToDirectives,
	remarkRelativeImports,
	remarkTOC,
} from "./remark-plugins";
import solidBaseVitePlugin from "./vite-plugin";

export interface SidebarLink {
	title: string;
	link: string;
}

export interface SidebarItem {
	title: string;
	collapsed: boolean;
	items: (SidebarItem | SidebarLink)[];
}

export interface SocialLink {
	type: "discord" | "github" | "opencollective" | "custom";
	link: string;
	logo?: string;
	label?: string;
}

export type Sidebar = {
	headerTitle?: string;
	items: SidebarItem[];
};

export type SolidBaseConfig = {
	title?: string;
	description?: string;
	logo?: string;
	titleTemplate?: string;
	componentsFolder?: string;
	editPath?: string | ((path: string) => string);
	lastUpdated?: Intl.DateTimeFormatOptions | false;
	footer?: boolean;
	socialLinks?:
		| Record<Exclude<SocialLink["type"], "custom">, string>
		| Record<string, Omit<SocialLink, "type">>;
	lang?: string;
	locales?: Record<string, LocaleConfig>;
	nav?: Array<NavItem>;
	sidebar?: Sidebar | Record<`/${string}`, Sidebar>;
	search?: SearchConfig;
};

type ResolvedConfigKeys =
	| "title"
	| "description"
	| "lastUpdated"
	| "footer"
	| "lang";

export type SolidBaseResolvedConfig = Omit<
	SolidBaseConfig,
	ResolvedConfigKeys
> &
	Required<Pick<SolidBaseConfig, ResolvedConfigKeys>>;

export type LocaleConfig = {
	label: string;
	lang?: string;
	link?: string;
	config?: SolidBaseConfig;
};

export type NavItem = {
	text: string;
	link: string;
	activeMatch?: string;
};

export function withSolidBase(
	startConfig?: SolidStartInlineConfig,
	solidBaseConfig?: SolidBaseConfig,
) {
	const config = startConfig ?? {};
	const baseConfig: Partial<SolidBaseConfig> = solidBaseConfig ?? {};

	baseConfig.title ??= "SolidBase";
	baseConfig.description ??= "Solid Start Powered Static Site Generator";
	baseConfig.lastUpdated ??= { dateStyle: "short", timeStyle: "short" };
	baseConfig.footer ??= true;
	baseConfig.lang ??= "en-US";
	baseConfig.sidebar ??= { items: [] };

	process.env.PORT ??= "4000";

	config.extensions = [
		...new Set((config.extensions ?? []).concat(["md", "mdx"])),
	];

	const vite = config.vite;
	config.vite = (options) => {
		const viteConfig =
			typeof vite === "function"
				? vite(options)
				: ({ ...(vite ?? {}) } as ViteCustomizableConfig);

		((viteConfig.optimizeDeps ??= {}).exclude ??= []).push("fsevents");

		viteConfig.plugins ??= [];
		viteConfig.plugins.push(
			mdx.default.withImports({})({
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
						},
					],
					rehypeFixExpressiveCodeJsx,
				],
				remarkPlugins: [
					remarkFrontmatter,
					remarkMdxFrontmatter,
					remarkGfm,
					remarkGithubAlertsToDirectives,
					remarkDirective,
					remarkRelativeImports,
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
