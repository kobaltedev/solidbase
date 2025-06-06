// https://github.com/remcohaszing/remark-mdx-frontmatter MIT

import { valueToEstree } from "estree-util-value-to-estree";
import type { Literal, Root, RootData } from "mdast";
import { parse as parseToml } from "toml";
import type { Plugin } from "unified";
import { define } from "unist-util-mdx-define";
import { parse as parseYaml } from "yaml";

export interface FrontmatterRoot extends Root {
	data?: RootData & {
		frontmatter?: Record<string, unknown>;
	};
}

type FrontmatterParsers = Record<string, (value: string) => unknown>;

export interface RemarkMdxFrontmatterOptions extends define.Options {
	/**
	 * If specified, the YAML data is exported using this name. Otherwise, each
	 * object key will be used as an export name.
	 */
	name?: string;

	/**
	 * A mapping of node types to parsers.
	 *
	 * Each key represents a frontmatter node type. The value is a function that accepts the
	 * frontmatter data as a string, and returns the parsed data.
	 *
	 * By default `yaml` nodes will be parsed using [`yaml`](https://github.com/eemeli/yaml) and
	 * `toml` nodes using [`toml`](https://github.com/BinaryMuse/toml-node).
	 */
	parsers?: FrontmatterParsers;
}

/**
 * A remark plugin to expose frontmatter data as named exports.
 *
 * @param options Optional options to configure the output.
 * @returns A unified transformer.
 */
export const remarkMdxFrontmatter: Plugin<
	[RemarkMdxFrontmatterOptions?],
	FrontmatterRoot
> = ({ name = "frontmatter", parsers, ...options } = {}) => {
	const allParsers: FrontmatterParsers = {
		yaml: parseYaml,
		toml: parseToml,
		...parsers,
	};

	return (ast, file) => {
		let data: Record<string, unknown> = {};
		const node = ast.children.find((child) =>
			Object.hasOwn(allParsers, child.type),
		);

		if (node) {
			const parser = allParsers[node.type];

			const { value } = node as Literal;
			data = parser(value) as Record<string, unknown>;
		}

		const variables = {
			[name]: valueToEstree(data, { preserveReferences: true }),
		} as define.Variables;

		define(ast, file, variables, options);

		ast.data ??= {};
		ast.data.frontmatter = data;
	};
};
