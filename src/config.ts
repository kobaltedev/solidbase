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

import { rehypeFixExpressiveCodeJsx } from "./rehype-plugins";
import {
  remarkCustomContainers,
  remarkGithubAlertsToDirectives,
  remarkIssueAutolink,
  remarkRelativeImports,
  remarkTOC,
} from "./remark-plugins";
import solidBaseVitePlugin from "./vite-plugin";
import { defaultTheme } from "./default-theme/config";

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
};

type ResolvedConfigKeys = "title" | "description" | "lang" | "issueAutolink";

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

export const withSolidBase = createWithSolidBase(defaultTheme);

function createWithSolidBase<ThemeConfig, ResolvedThemeConfig>(
  theme: (config: ThemeConfig) => ResolvedThemeConfig,
) {
  return (
    startConfig?: SolidStartInlineConfig,
    solidBaseConfig?: SolidBaseConfig<ThemeConfig>,
  ) => {
    const config = startConfig ?? {};
    const baseConfig: Partial<SolidBaseConfig<ResolvedThemeConfig>> = {
      title: "SolidBase",
      description: "Solid Start Powered Static Site Generator",
      lang: "en-US",
      issueAutolink: false,
      ...solidBaseConfig,
      locales: Object.entries(solidBaseConfig?.locales ?? {}).reduce(
        (acc, [key, value]) => {
          acc[key] = {
            ...value,
            themeConfig: theme(value.themeConfig ?? ({} as ThemeConfig)),
          };
          return acc;
        },
        {} as any,
      ),
      themeConfig: theme(solidBaseConfig?.themeConfig ?? ({} as ThemeConfig)),
    };

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
            [remarkIssueAutolink, baseConfig.issueAutolink],
          ],
        }),
      );

      viteConfig.plugins.push(solidBaseVitePlugin(config, baseConfig));

      return viteConfig;
    };

    return config;
  };
}
