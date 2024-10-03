import type {
  SolidStartInlineConfig,
  ViteCustomizableConfig,
} from "@solidjs/start/config";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";

import solidBaseVitePlugin from "./vite-plugin";

export type SolidBaseConfig = {
  title?: string;
  description?: string;
  componentsFolder?: string;
};

export function withSolidBase(
  startConfig?: SolidStartInlineConfig,
  solidBaseConfig?: SolidBaseConfig,
) {
  const config = startConfig ?? {};
  const baseConfig = solidBaseConfig ?? {};

  process.env.PORT ??= "4000";

  config.extensions = [
    ...new Set((config.extensions ?? []).concat(["md", "mdx"])),
  ];

  const vite = config.vite;
  config.vite = (options) => {
    const viteConfig =
      typeof vite === "function"
        ? vite(options)
        : ((vite ?? {}) as ViteCustomizableConfig);

    viteConfig.plugins ??= [];
    viteConfig.plugins.push(
      mdx.default.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        rehypePlugins: [rehypeSlug],
      }),
    );

    viteConfig.plugins.push(solidBaseVitePlugin(config, baseConfig));

    return viteConfig;
  };

  return config;
}
