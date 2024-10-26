import { access, readdir } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import type { SolidStartInlineConfig } from "@solidjs/start/config";

import type { SolidBaseConfig } from "../../config";
import { getGitTimestamp } from "../git";
import { SolidBaseTOC } from "../remark-plugins";
import { Theme } from "..";

export async function loadVirtual(
  theme: Theme<any>,
  startConfig: SolidStartInlineConfig,
  solidBaseConfig: Partial<SolidBaseConfig<any>>,
) {
  let template = `
  	export const solidBaseConfig = ${JSON.stringify(solidBaseConfig)}
  `;

  const themePaths = (() => {
    let t: Theme<any> | undefined = theme;
    const paths: Array<string> = [];

    while (t !== undefined) {
      paths.push(fileURLToPath(t.path));
      t = t.extends;
    }

    paths.reverse();

    return paths;
  })();

  const mdxComponentFiles: Array<{ importName: string; path: string }> = [];

  for (let i = 0; i < themePaths.length; i++) {
    const themePath = themePaths[i]!;

    const dir: string[] = await readdir(themePath).catch(() => []);

    const mdxComponentsFile = dir.find((url) => {
      const name = parse(url).name;
      return name === "mdx-components";
    });

    if (mdxComponentsFile)
      mdxComponentFiles.push({
        importName: `mdxComponents${i}`,
        path: `${themePath}/mdx-components`,
      });
  }

  template += `
		import { lazy } from "solid-js";
		export const Layout = lazy(() => import("${themePaths[themePaths.length - 1]}/Layout"));

		${mdxComponentFiles.map((file) => `import * as ${file.importName} from "${file.path}";\n`).join("")}
		export const mdxComponents = {
			${mdxComponentFiles.map((file) => `...${file.importName}`).join(",\n")}
		};
	`;

  return template;
}

export async function transformMdxModule(
  code: string,
  id: string,
  startConfig: SolidStartInlineConfig,
  solidBaseConfig: Partial<SolidBaseConfig<any>>,
) {
  const rootPath = join(
    dirname(fileURLToPath(import.meta.url)),
    startConfig?.appRoot ?? "./src",
    "routes",
  );

  const modulePath = id.split("?")[0];

  let modulePathLink = "";
  if (solidBaseConfig.editPath) {
    const path = modulePath.slice(rootPath.length).replace(/^\//, "");

    if (typeof solidBaseConfig.editPath === "string")
      modulePathLink = solidBaseConfig.editPath.replace(/:path/g, path);
    else modulePathLink = solidBaseConfig.editPath(path);
  }

  let lastUpdated = 0;
  if (solidBaseConfig.lastUpdated) {
    lastUpdated = await getGitTimestamp(modulePath);
  }

  return `
		${code}
		const data = {
			frontmatter: typeof frontmatter !== "undefined" ? frontmatter : {},
			toc: ${SolidBaseTOC},
			editLink: "${modulePathLink}",
			lastUpdated: ${lastUpdated},
		};

		if (typeof window !== "undefined") {
			window.$$SolidBase_page_data ??= {};
			window.$$SolidBase_page_data["${modulePath}"] = data;
		}

		export const $$SolidBase_page_data = data;
	`;
}
