import type { SolidStartInlineConfig } from "@solidjs/start/config";
import { readdir } from "node:fs/promises";
import { join, parse } from "node:path";
// @ts-expect-error
import mdx from "@vinxi/plugin-mdx";

export type SolidBaseConfig = {};

export function withSolidBase(
  startConfig?: SolidStartInlineConfig,
  solidBaseConfig?: SolidBaseConfig,
) {
  const config = startConfig ?? {};

  process.env.PORT ??= "4000";

  config.extensions = [
    ...new Set((config.extensions ?? []).concat(["md", "mdx"])),
  ];

  const vite = config.vite;
  config.vite = (options) => {
    const viteConfig = typeof vite === "function" ? vite(options) : vite ?? {};

    viteConfig.plugins ??= [];
    viteConfig.plugins.push(
      mdx.default.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
      }),
    );

    const virtualModuleId = "virtual:solidbase";
    const resolvedVirtualModuleId = `\0${virtualModuleId}`;

    viteConfig.plugins.push({
      name: "solidbase",
      enforce: "pre",
      resolveId(id) {
        if (id === virtualModuleId) {
          return resolvedVirtualModuleId;
        }
      },
      async load(id) {
        if (id === resolvedVirtualModuleId) {
          const componentsPath = join(
            process.cwd(),
            startConfig?.appRoot ?? "./src",
            "solidbase-components",
          );
          const componentFiles = await readdir(componentsPath).catch(() => []);
          const componentNames = componentFiles.map((file) => parse(file).name);

          return `
          	${componentNames.map((name) => `import ${name} from "${join(componentsPath, name)}";`).join("\n")}

           	export const mdxComponents = { ${componentNames.join(", ")} };
          `;
        }
      },
    });

    return viteConfig;
  };

  return config;
}
