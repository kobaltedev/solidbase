import type {
  SolidStartInlineConfig,
  ViteCustomizableConfig,
} from "@solidjs/start/config";
import { type Plugin as VitePlugin } from "vite";

import solidBaseVitePlugin from "./vite-plugin";
import { solidBaseMdx } from "./mdx";
import defaultTheme from "../default-theme";

export type SolidBaseConfig<ThemeConfig> = {
  title?: string;
  description?: string;
  logo?: string;
  titleTemplate?: string;
  componentsFolder?: string;
  issueAutolink?: false | string | ((issue: string) => string);
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

export type ThemeDefinition<InputConfig, ResolvedConfig> = {
  path: string;
  extends?: ThemeDefinition<InputConfig, ResolvedConfig>;
  resolveConfig: (c: InputConfig) => ResolvedConfig;
  vite?(config: ResolvedConfig): Omit<VitePlugin, "name">;
};

export const withSolidBase = createWithSolidBase(defaultTheme);

export function createWithSolidBase<ThemeConfig, ResolvedThemeConfig>(
  theme: ThemeDefinition<ThemeConfig, ResolvedThemeConfig>,
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

    const themeConfig = theme.resolveConfig(
      solidBaseConfig?.themeConfig ?? ({} as ThemeConfig),
    );
    const sbConfig: SolidBaseResolvedConfig<ResolvedThemeConfig> = {
      title: "SolidBase",
      description: "Solid Start Powered Static Site Generator",
      lang: "en-US",
      issueAutolink: false,
      lastUpdated: { dateStyle: "short", timeStyle: "short" },
      ...solidBaseConfig,
      locales: Object.entries(solidBaseConfig?.locales ?? {}).reduce(
        (acc, [key, value]) => {
          acc[key] = {
            ...value,
            themeConfig: theme.resolveConfig(
              value.themeConfig ?? ({} as ThemeConfig),
            ),
          };
          return acc;
        },
        {} as any,
      ),
      themeConfig,
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

      if (theme.vite)
        viteConfig.plugins.push(
          Object.assign({
            ...theme.vite(themeConfig),
            name: "solidbase-theme",
          }),
        );

      return viteConfig;
    };

    return config;
  };
}

import { dirname } from "node:path";
export function defineTheme<I, R>(def: ThemeDefinition<I, R>) {
  def.path = dirname(def.path);
  return def;
}
export type Theme<I, R> = ReturnType<typeof defineTheme<I, R>>;
