import { readFile, readdir } from "node:fs/promises";
import { parse } from "node:path";
import { fileURLToPath } from "node:url";

import MagicString from "magic-string";
import type { PluginContext } from "rolldown";
import { getGitTimestamp } from "../git.js";
import type { SolidBaseConfig, Theme } from "../index.js";
import { SolidBaseTOC } from "../remark-plugins/toc.js";

type VirtualModule<T = void> = {
	id: string;
	resolvedId: string;
	load(this: PluginContext, arg: T): Promise<string>;
};

export const configModule: VirtualModule<Partial<SolidBaseConfig<any>>> = {
	id: "virtual:solidbase/config",
	resolvedId: "\0virtual:solidbase/config",
	load: async (solidBaseConfig) =>
		`export const solidBaseConfig = ${JSON.stringify(solidBaseConfig)};`,
};

export const componentsModule: VirtualModule<Theme<any>> = {
	id: "virtual:solidbase/components",
	resolvedId: "\0virtual:solidbase/components",
	async load(theme) {
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

function getMarkdownModulePath(id: string) {
	const [pathname, search = ""] = id.split(/\?(.*)/s);
	const params = new URLSearchParams(search);
	const nestedId = params.get("id");

	if (nestedId) return nestedId.split("?")[0]!;

	return pathname!;
}

export async function transformMdxModule(
	code: string,
	id: string,
	solidBaseConfig: Partial<SolidBaseConfig<any>>,
) {
	const rootPath = process.env.PWD!;

	const modulePath = getMarkdownModulePath(id);

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

	const s = new MagicString(code);

	s.append(`
		const data = {
			frontmatter: typeof frontmatter !== "undefined" ? (frontmatter ?? {}) : {},
			toc: typeof ${SolidBaseTOC} !== "undefined" ? ${SolidBaseTOC} : undefined,
			editLink: "${modulePathLink}",
			lastUpdated: ${lastUpdated},
			llmText: ${JSON.stringify(llmText)},
		};

		if (typeof window !== "undefined") {
			window.$$SolidBase_page_data ??= {};
			window.$$SolidBase_page_data["${modulePath}"] = data;
		}

		export const $$SolidBase_page_data = data;
	`);

	return {
		code: s.toString(),
		map: s.generateMap(),
	};
}
