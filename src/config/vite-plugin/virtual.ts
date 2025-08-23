import { readdir } from "node:fs/promises";
import { parse } from "node:path";
import { fileURLToPath } from "node:url";

import { getGitTimestamp } from "../git.js";
import type { Theme } from "../index.js";
import type { SolidBaseConfig } from "../index.js";
import { SolidBaseTOC } from "../remark-plugins/toc.js";

export const configModule = {
	id: "virtual:solidbase/config",
	resolvedId: "\0virtual:solidbase/config",
	load: (solidBaseConfig: Partial<SolidBaseConfig<any>>) =>
		`export const solidBaseConfig = ${JSON.stringify(solidBaseConfig)};`,
};

export const componentsModule = {
	id: "virtual:solidbase/components",
	resolvedId: "\0virtual:solidbase/components",
	load: async (theme: Theme<any>) => {
		const themePaths = (() => {
			let t: Theme<any> | undefined = theme;
			const paths: Array<string> = [];

			while (t !== undefined) {
				paths.push(fileURLToPath(t.componentsPath).replaceAll("\\", "/"));
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

		return `
export { default as Layout } from "${themePaths[themePaths.length - 1]}/Layout";

${mdxComponentFiles.map((file) => `import * as ${file.importName} from "${file.path}";\n`).join("")}

export const mdxComponents = {
${mdxComponentFiles.map((file) => `...${file.importName}`).join(",\n")}
};
`;
	},
};

export async function transformMdxModule(
	code: string,
	id: string,
	solidBaseConfig: Partial<SolidBaseConfig<any>>,
) {
	const rootPath = process.env.PWD!;

	const modulePath = id.split("?")[0];

	let modulePathLink = "";
	if (solidBaseConfig.editPath && modulePath.startsWith(rootPath)) {
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
			frontmatter: typeof frontmatter !== "undefined" ? (frontmatter ?? {}) : {},
			toc: typeof ${SolidBaseTOC} !== "undefined" ? ${SolidBaseTOC} : undefined,
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
