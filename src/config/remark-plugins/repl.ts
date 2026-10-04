import { MetaOptions } from "@expressive-code/core";
import { valueToEstree } from "estree-util-value-to-estree";
import type { Code, Root } from "mdast";
import type { Transformer } from "unified";
import { SKIP, visit } from "unist-util-visit";
import type { VFile } from "vfile";

export interface ReplTab {
	name: string;
	source: string;
}

export const REPL_ENTRY_FILE = "main.tsx";

function fail(file: VFile | undefined, node: unknown, reason: string): never {
	if (file) {
		file.fail(reason, node as any);
	}

	throw new Error(reason);
}

function getTabName(code: Code, index: number, file?: VFile) {
	const title = new MetaOptions(code.meta ?? "").getString("title");
	if (title) return title;
	if (index === 0) return REPL_ENTRY_FILE;

	fail(
		file,
		code,
		"code blocks after the first in a repl directive must have a title",
	);
}

function createTabs(codes: Code[], file?: VFile) {
	const tabs: ReplTab[] = [];

	codes.forEach((code, index) => {
		const name = getTabName(code, index, file);

		if (tabs.some((tab) => tab.name === name)) {
			fail(file, code, `repl directives contain duplicate file "${name}"`);
		}

		tabs.push({ name, source: code.value });
	});

	return tabs;
}

function createReplElement(
	codes: Code[],
	attributes: Record<string, unknown>,
	file?: VFile,
) {
	const tabs = createTabs(codes, file);

	return {
		type: "mdxJsxFlowElement",
		name: "Repl",
		children: [],
		attributes: [
			...Object.entries(attributes)
				.filter(([, value]) => value !== undefined)
				.map(([name, value]) => ({
					type: "mdxJsxAttribute",
					name,
					// bare directive attributes (`{devtools}`) become boolean props
					value: value === null || value === "" ? null : String(value),
				})),
			{
				type: "mdxJsxAttribute",
				name: "tabs",
				value: {
					type: "mdxJsxAttributeValueExpression",
					value: JSON.stringify(tabs),
					data: {
						estree: {
							type: "Program",
							sourceType: "module",
							body: [
								{
									type: "ExpressionStatement",
									expression: valueToEstree(tabs),
								},
							],
						},
					},
				},
			},
		],
	};
}

export function remarkRepl(): Transformer<Root, Root> {
	return (tree, file) => {
		visit(tree, (node: any, index, parent: any) => {
			if (index === undefined || parent === undefined) return;

			if (node.type === "containerDirective" && node.name === "repl") {
				const maybeLabel = node.children[0];
				if (maybeLabel?.data?.directiveLabel) {
					fail(file, maybeLabel, "repl directives do not support titles");
				}

				if (node.children.length === 0) {
					fail(
						file,
						node,
						"repl directives must contain at least one code block",
					);
				}

				for (const child of node.children) {
					if (child.type !== "code") {
						fail(file, child, "repl directives may only contain code blocks");
					}
				}

				parent.children[index] = createReplElement(
					node.children,
					node.attributes ?? {},
					file,
				);
				return SKIP;
			}

			if (node.type === "code") {
				const meta = new MetaOptions(node.meta ?? "");
				if (!meta.getBoolean("repl")) return;

				parent.children[index] = createReplElement([node], {}, file);
				return SKIP;
			}
		});
	};
}
