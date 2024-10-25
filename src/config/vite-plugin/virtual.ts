import { readdir } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import type { SolidStartInlineConfig } from "@solidjs/start/config";

import type { SolidBaseConfig } from "../../config";
import { getGitTimestamp } from "../git";
import { SolidBaseTOC } from "../remark-plugins";
import { Theme } from "..";

export async function loadVirtual(
  theme: Theme<any, any>,
  startConfig: SolidStartInlineConfig,
  solidBaseConfig: Partial<SolidBaseConfig<any>>,
) {
  const componentsPath = join(
    dirname(fileURLToPath(import.meta.url)),
    startConfig?.appRoot ?? "./src",
    solidBaseConfig?.componentsFolder ?? "solidbase",
  );
  let template = "";

  template += `
		export const solidBaseConfig = ${JSON.stringify(solidBaseConfig)};
	`;

  const componentFiles = await readdir(componentsPath).catch(() => []);
  const componentNames = componentFiles.map((file) => parse(file).name);

  if (componentNames.includes("mdx-components")) {
    template += `
			export * as overrideMdxComponents from "${join(componentsPath, "mdx-components")}";
		`;
  } else {
    template += `
			export const overrideMdxComponents = {};
		`;
  }

  const components = componentNames.filter(
    (name) => name[0] === name[0].toUpperCase(),
  );

  template += `
		${components.map((name) => `import ${name} from "${join(componentsPath, name)}"`).join("\n")}

		export const solidBaseComponents = {
			${components.join(",\n")}
		};
	`;

  template += `
		import { lazy } from "solid-js";
		export const Root = lazy(() => import("${fileURLToPath(theme.path)}/components"));
		export * as mdxComponents from "${fileURLToPath(theme.path)}/mdx-components";
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
