import { readFileSync } from "node:fs";
import { parse as parseToml } from "toml";
import { parse as parseYaml } from "yaml";

const FRONTMATTER_PARSERS = [
	{ fence: "---", parse: parseYaml },
	{ fence: "+++", parse: parseToml },
] as const;

/**
 * Extracts and parses the leading frontmatter block of a markdown source.
 *
 * Matches the formats supported by the MDX pipeline (`remark-frontmatter`):
 * YAML fenced by `---` and TOML fenced by `+++`.
 */
export function parseFrontmatter(source: string): Record<string, unknown> {
	const content = source.replace(/^\uFEFF/, "");

	for (const { fence, parse } of FRONTMATTER_PARSERS) {
		const escaped = fence.replace(/[+]/g, "\\+");
		const match = content.match(
			new RegExp(
				`^${escaped}[ \\t]*\\r?\\n(?:([\\s\\S]*?)\\r?\\n)?${escaped}[ \\t]*(?:\\r?\\n|$)`,
			),
		);
		if (!match) continue;

		const data = parse(match[1] ?? "");
		return data && typeof data === "object" && !Array.isArray(data)
			? (data as Record<string, unknown>)
			: {};
	}

	return {};
}

export function readFrontmatter(filePath: string): Record<string, unknown> {
	return parseFrontmatter(readFileSync(filePath, "utf8"));
}
