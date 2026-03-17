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
		.use(remarkStringify);

	const file = await processor.process(
		new VFile({ path: options.filePath, value: source }),
	);

	return String(file).trim();
}
