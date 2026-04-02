import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { VFile } from "vfile";

import type { RemarkPipelineConfig } from "./mdx.js";
import { getRemarkPlugins } from "./mdx.js";
import {
	evaluateInlineFrontmatterExpression,
	isInlineFrontmatterExpression,
	remarkInlineFrontmatter,
} from "./remark-plugins/inline-frontmatter.js";

type DocumentMarkdownOptions = {
	config?: RemarkPipelineConfig;
	filePath?: string;
};

function renderExpressionValue(value: unknown): string | null {
	if (value === null || value === undefined || typeof value === "boolean") {
		return "";
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "bigint"
	) {
		return String(value);
	}

	if (Array.isArray(value)) {
		return value
			.map((entry) => renderExpressionValue(entry))
			.filter((entry): entry is string => entry !== null)
			.join("");
	}

	return null;
}

function remarkDocumentInlineFrontmatter() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (
				(node.type !== "mdxTextExpression" &&
					node.type !== "mdxFlowExpression") ||
				index === undefined ||
				parent === undefined ||
				!isInlineFrontmatterExpression(node.value)
			) {
				return;
			}

			let value: unknown;
			try {
				value = evaluateInlineFrontmatterExpression(
					tree.data.frontmatter,
					node.value,
				);
			} catch {
				return;
			}

			const text = renderExpressionValue(value);
			if (text === null) return;

			if (node.type === "mdxTextExpression") {
				parent.children.splice(index, 1, {
					type: "text",
					value: text,
				});
				return [SKIP, index];
			}

			if (text === "") {
				parent.children.splice(index, 1);
				return [SKIP, index];
			}

			parent.children.splice(index, 1, {
				type: "paragraph",
				children: [{ type: "text", value: text }],
			});
			return [SKIP, index];
		});
	};
}

function remarkStripDocumentMetadata() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (
				index === undefined ||
				parent === undefined ||
				(node.type !== "yaml" &&
					node.type !== "toml" &&
					node.type !== "mdxjsEsm")
			) {
				return;
			}

			parent.children.splice(index, 1);
			return [SKIP, index];
		});
	};
}

function getJsxAttributeValue(
	node: { attributes?: Array<{ type: string; name: string; value?: unknown }> },
	name: string,
) {
	return node.attributes?.find((attr) => attr.type === "mdxJsxAttribute" && attr.name === name)
		?.value;
}

function createLabelParagraph(label: string) {
	return {
		type: "paragraph",
		children: [
			{
				type: "strong",
				children: [{ type: "text", value: label }],
			},
		],
	};
}

function normalizeMdxChildren(nodes: any[]): any[] {
	return nodes.flatMap((node) => {
		const normalized = normalizeMdxNode(node);
		if (normalized === null) return [];
		return Array.isArray(normalized) ? normalized : [normalized];
	});
}

function normalizeDirectiveContainer(node: any) {
	const type = getJsxAttributeValue(node, "type");
	const title = getJsxAttributeValue(node, "title");
	const rawChildren = node.children ?? [];

	if (type === "tab-group") {
		const tabs = rawChildren.filter(
			(child: any) =>
				child?.type === "mdxJsxFlowElement" &&
				getJsxAttributeValue(child, "type") === "tab",
		);

		if (title === "package-manager") {
			const codeBlocks = tabs
				.map((child) => normalizeMdxChildren(child.children ?? []))
				.flat()
				.filter((child) => child?.type === "code");

			const lang = codeBlocks[0]?.lang ?? "sh";
			const value = codeBlocks
				.map((child) => child.value)
				.filter((child): child is string => typeof child === "string")
				.join("\n");

			if (value) {
				return [
					{
						type: "code",
						lang,
						value,
					},
				];
			}
		}

		const tabNames = String(getJsxAttributeValue(node, "tabNames") ?? "")
			.split("\0")
			.filter(Boolean);

		return tabs.flatMap((child, index) => {
			const childTitle = getJsxAttributeValue(child, "title");
			const childChildren = normalizeMdxChildren(child.children ?? []);
			const label = tabNames[index] ?? childTitle;

			return [
				...(typeof label === "string" && label !== " "
					? [createLabelParagraph(label)]
					: []),
				...childChildren,
			];
		});
	}

	const children = normalizeMdxChildren(rawChildren);

	if (type === "tab") {
		return children;
	}

	const label =
		typeof title === "string" && title !== " "
			? title
			: typeof type === "string"
				? type
				: undefined;

	return [
		...(label ? [createLabelParagraph(label)] : []),
		...children,
	];
}

function normalizeMdxNode(node: any): any[] | any | null {
	if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
		return null;
	}

	if (node.type === "mdxJsxTextElement") {
		return normalizeMdxChildren(node.children ?? []);
	}

	if (node.type === "mdxJsxFlowElement") {
		if (node.name === "DirectiveContainer") {
			return normalizeDirectiveContainer(node);
		}

		if (node.name === "Steps" || node.name === "Step") {
			return normalizeMdxChildren(node.children ?? []);
		}

		return normalizeMdxChildren(node.children ?? []);
	}

	if (Array.isArray(node.children)) {
		return {
			...node,
			children: normalizeMdxChildren(node.children),
		};
	}

	return node;
}

function remarkNormalizeMdxToMarkdown() {
	return (tree: any) => {
		tree.children = normalizeMdxChildren(tree.children ?? []);
	};
}

function getDocumentRemarkPlugins(config: RemarkPipelineConfig = {}) {
	return getRemarkPlugins(config).map((plugin) =>
		plugin === remarkInlineFrontmatter
			? remarkDocumentInlineFrontmatter
			: plugin,
	);
}

export async function toDocumentMarkdown(
	source: string,
	options: DocumentMarkdownOptions = {},
) {
	const processor = unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(getDocumentRemarkPlugins(options.config))
		.use(remarkStripDocumentMetadata)
		.use(remarkNormalizeMdxToMarkdown)
		.use(remarkStringify);

	const file = await processor.process(
		new VFile({ path: options.filePath, value: source }),
	);

	return String(file).trim();
}
