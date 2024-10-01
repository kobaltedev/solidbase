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

	if (componentNames.includes("Mdx")) {
		template += `
			export * as overrideMdxComponents from "${join(componentsPath, "Mdx")}";
		`;
	}

	return template;
}
