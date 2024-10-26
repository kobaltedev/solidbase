import type {
  SolidStartInlineConfig,
  ViteCustomizableConfig,
} from "@solidjs/start/config";
import { Plugin, type Plugin as VitePlugin } from "vite";

import solidBaseVitePlugin from "./vite-plugin";
import { solidBaseMdx } from "./mdx";
import defaultTheme from "../default-theme";

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
  path: string;
  extends?: ThemeDefinition<Config>;
  vite?(config: SolidBaseResolvedConfig<Config>): Omit<VitePlugin, "name">;
};

export const withSolidBase = createWithSolidBase(defaultTheme);

export function createWithSolidBase<ThemeConfig>(
  theme: ThemeDefinition<ThemeConfig>,
) {
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
      let plugins: Array<Plugin> = [];
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

import { dirname } from "node:path";
import { IssueAutoLinkConfig } from "./remark-plugins";
export function defineTheme<C>(def: ThemeDefinition<C>) {
  def.path = dirname(def.path);
  return def;
}
export type Theme<C> = ReturnType<typeof defineTheme<C>>;
