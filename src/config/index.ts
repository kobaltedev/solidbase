import type {
	SolidStartInlineConfig,
	ViteCustomizableConfig,
} from "@solidjs/start/config";
import type { Plugin, Plugin as VitePlugin } from "vite";

import defaultTheme from "../default-theme";
import { solidBaseMdx } from "./mdx";
import solidBaseVitePlugin from "./vite-plugin";

export type SolidBaseConfig<ThemeConfig> = {
	title?: string;
	description?: string;
	logo?: string;
	titleTemplate?: string;
	// componentsFolder?: string;
	issueAutolink?: IssueAutoLinkConfig;
	lang?: string;
	locales?: Record<string, LocaleConfig<ThemeConfig>>;
	themeConfig?: ThemeConfig;
	editPath?: string | ((path: string) => string);
	lastUpdated?: Intl.DateTimeFormatOptions | false;
};

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
	componentsPath: string;
	extends?: ThemeDefinition<Config>;
	vite?(config: SolidBaseResolvedConfig<Config>): Omit<VitePlugin, "name">;
};

export const withSolidBase = createWithSolidBase(defaultTheme);

export function createWithSolidBase<ThemeConfig>(
	theme: ThemeDefinition<ThemeConfig>,
) {
	if (parse(theme.componentsPath).ext !== "") {
		theme.componentsPath = dirname(theme.componentsPath);
	}

	return (
		startConfig?: SolidStartInlineConfig,
		solidBaseConfig?: SolidBaseConfig<ThemeConfig>,
	) => {
		const config = startConfig ?? {};

		process.env.PORT ??= "4000";

		config.extensions = [
			...new Set((config.extensions ?? []).concat(["md", "mdx"])),
		];

		const sbConfig: SolidBaseResolvedConfig<ThemeConfig> = {
			title: "SolidBase",
			description: "Solid Start Powered Static Site Generator",
			lang: "en-US",
			issueAutolink: false,
			lastUpdated: { dateStyle: "short", timeStyle: "short" },
			...solidBaseConfig,
		};

		const vite = config.vite;
		config.vite = (options) => {
			const viteConfig =
				typeof vite === "function"
					? vite(options)
					: ({ ...(vite ?? {}) } as ViteCustomizableConfig);

			((viteConfig.optimizeDeps ??= {}).exclude ??= []).push("fsevents");

			viteConfig.plugins ??= [];
			viteConfig.plugins.push(solidBaseMdx(sbConfig));
			viteConfig.plugins.push(solidBaseVitePlugin(theme, config, sbConfig));

			let t: ThemeDefinition<any> | undefined = theme;
			const plugins: Array<Plugin> = [];
			while (t !== undefined) {
				if (t.vite)
					plugins.push({
						...t.vite(sbConfig),
						name: `solidbase-theme-${plugins.length}`,
					});

				t = t.extends;
			}
			plugins.reverse();

			viteConfig.plugins.push(...plugins);

			return viteConfig;
		};

		return config;
	};
}

import { dirname, parse } from "node:path";
import type { IssueAutoLinkConfig } from "./remark-plugins";
export function defineTheme<C>(def: ThemeDefinition<C>) {
	return def;
}
export type Theme<C> = ReturnType<typeof defineTheme<C>>;
