import { readdir } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import type { SolidStartInlineConfig } from "@solidjs/start/config";
import type { SolidBaseConfig } from "../config";

export async function loadVirtual(
	startConfig: SolidStartInlineConfig,
	solidBaseConfig: SolidBaseConfig,
) {
	const componentsPath = join(
		dirname(fileURLToPath(import.meta.url)),
		startConfig?.appRoot ?? "./src",
		solidBaseConfig?.componentsFolder ?? "solidbase-components",
	);

	const componentFiles = await readdir(componentsPath).catch(() => []);
	const componentNames = componentFiles.map((file) => parse(file).name);

	let template = "";

	if (componentNames.includes("mdx-components")) {
		template += `
			export * as overrideMdxComponents from "${join(componentsPath, "mdx-components")}";
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

	return template;
}

export function transformMdxModule(code: string, id: string) {
	return `
		${code}
		const data = {
			frontmatter: typeof frontmatter !== "undefined" ? frontmatter : {},
			toc: JSON.parse($$SolidBase_TOC),
		};

		if (typeof window !== "undefined") {
			window.$$SolidBase_page_data ??= {};
			window.$$SolidBase_page_data["${id.split("?")[0]}"] = data;
		}

		export const $$SolidBase_page_data = data;
	`;
}
