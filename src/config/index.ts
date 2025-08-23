import type { Options as AutoImportOptions } from "unplugin-auto-import/dist/types.js";
import type { ComponentResolverOption } from "unplugin-icons/resolver";
import type { Options as IconsOptions } from "unplugin-icons/types";
import type { PluginOption } from "vite";

import defaultTheme from "../default-theme/index.js";
import { type MdxOptions, solidBaseMdx } from "./mdx.js";
import type { IssueAutoLinkConfig } from "./remark-plugins/issue-autolink.js";
import solidBaseVitePlugin from "./vite-plugin/index.js";

export interface SolidBaseConfig<ThemeConfig> {
	title?: string;
	titleTemplate?: string;
	description?: string;
	logo?: string;
	issueAutolink?: IssueAutoLinkConfig | false;
	lang?: string;
	locales?: Record<string, LocaleConfig<ThemeConfig>>;
	themeConfig?: ThemeConfig;
	editPath?: string | ((path: string) => string);
	lastUpdated?: Intl.DateTimeFormatOptions | false;
	markdown?: MdxOptions;
	icons?: Omit<IconsOptions, "compiler"> | false;
	// disabled by default
	autoImport?:
	| (AutoImportOptions & { iconResolver?: ComponentResolverOption | false })
	| true;
}

type ResolvedConfigKeys =
	| "title"
	| "description"
	| "lang"
	| "issueAutolink"
	| "lastUpdated";

export type SolidBaseResolvedConfig<ThemeConfig> = Omit<
	SolidBaseConfig<ThemeConfig>,
	ResolvedConfigKeys
> &
	Required<Pick<SolidBaseConfig<ThemeConfig>, ResolvedConfigKeys>>;

export type LocaleConfig<ThemeConfig> = {
	label: string;
	lang?: string;
	link?: string;
	themeConfig?: ThemeConfig;
};

export type ThemeDefinition<Config> = {
	componentsPath: URL;
	extends?: ThemeDefinition<Config>;
	config?(config: SolidBaseResolvedConfig<Config>): void;
	vite?(config: SolidBaseResolvedConfig<Config>): PluginOption | undefined;
};

export const solidBase = createSolidBase(defaultTheme);

export function createSolidBase<ThemeConfig>(
	theme: ThemeDefinition<ThemeConfig>,
) {
	return (solidBaseConfig?: SolidBaseConfig<ThemeConfig>): PluginOption => {
		// const config = startConfig ?? {};

		// config.extensions = [
		// 	...new Set((config.extensions ?? []).concat(["md", "mdx"])),
		// ];
		// config.server ??= {};
		// config.server.prerender ??= {
		// 	crawlLinks: true,
		// };

		const sbConfig: SolidBaseResolvedConfig<ThemeConfig> = {
			title: "SolidBase",
			description:
				"Fully featured, fully customisable static site generation for SolidStart",
			lang: "en-US",
			issueAutolink: false,
			lastUpdated: { dateStyle: "short", timeStyle: "short" },
			...solidBaseConfig,
		};

		{
			let t: ThemeDefinition<any> | undefined = theme;
			while (t !== undefined) {
				if (t.config) t.config(sbConfig);
				t = t.extends;
			}
		}

		let t: ThemeDefinition<any> | undefined = theme;
		const plugins: Array<PluginOption> = [];
		while (t !== undefined) {
			if (t.vite) {
				const contents = t.vite(sbConfig);
				if (contents) plugins.push(contents);
			}

			t = t.extends;
		}
		plugins.reverse();

		return [
			solidBaseMdx(sbConfig),
			solidBaseVitePlugin(theme, sbConfig),
			...plugins,
		];
	};
}

export function defineTheme<C>(def: ThemeDefinition<C>) {
	return def;
}
export type Theme<C> = ReturnType<typeof defineTheme<C>>;
