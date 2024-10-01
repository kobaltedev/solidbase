import type { SolidStartInlineConfig } from "@solidjs/start/config";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";

export type SolidBaseConfig = {};

export function withSolidBase(
  startConfig: SolidStartInlineConfig,
  solidBaseConfig: SolidBaseConfig,
) {
  startConfig.extensions = [
    ...new Set((startConfig.extensions ?? []).concat(["ts", "tsx"])),
  ];

  const vite = startConfig.vite;
  startConfig.vite = (options) => {
    const viteConfig = typeof vite === "function" ? vite(options) : vite ?? {};

    viteConfig.plugins ??= [];
    viteConfig.plugins.push(
      mdx.default.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
      }),
    );

    return viteConfig;
  };

  return startConfig;
}
