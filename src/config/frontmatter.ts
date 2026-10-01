import { readFileSync } from "node:fs";
import type { Literal } from "mdast";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import { parse as parseToml } from "toml";
import { type PluggableList, unified } from "unified";
import { parse as parseYaml } from "yaml";

export type FrontmatterOptions = {
	remarkPlugins?: PluggableList;
};

function getFrontmatterPlugins(plugins: PluggableList): PluggableList {
	return plugins.flatMap((plugin): PluggableList => {
		if (typeof plugin === "object" && !Array.isArray(plugin)) {
			return getFrontmatterPlugins(plugin.plugins ?? []);
		}
		return (Array.isArray(plugin) ? plugin[0] : plugin) === remarkFrontmatter
			? [plugin]
			: [];
	});
}

/**
 * Extracts and parses the leading frontmatter block of a markdown source.
 *
 * Uses the MDX pipeline's YAML default and any configured `remark-frontmatter`
 * overrides, including explicitly enabled TOML.
 */
export function parseFrontmatter(
	source: string,
	options: FrontmatterOptions = {},
): Record<string, unknown> {
	const processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(getFrontmatterPlugins(options.remarkPlugins ?? []));
	const node = processor
		.parse(source)
		.children.find((child) => ["yaml", "toml"].includes(child.type)) as
		| Literal
		| undefined;
	if (!node) return {};

	const parse = node.type === "toml" ? parseToml : parseYaml;
	const data = parse(node.value as string);
	return data && typeof data === "object" && !Array.isArray(data)
		? (data as Record<string, unknown>)
		: {};
}

export function readFrontmatter(
	filePath: string,
	options?: FrontmatterOptions,
): Record<string, unknown> {
	return parseFrontmatter(readFileSync(filePath, "utf8"), options);
}
