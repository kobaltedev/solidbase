import { fromJs } from "esast-util-from-js";
import type { PhrasingContent } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import { type Options, toc } from "mdast-util-toc";

interface ParagraphNode {
	type: "paragraph";
	url: string;
	children: [
		{
			type: "link";
			url: string;
			children: [{ type: "text"; value: string }];
		},
	];
}

interface ListItemNode {
	type: "listItem";
	children: [
		ParagraphNode,
		{ type: "list"; children: Array<ListItemNode> } | undefined,
	];
}

interface TOCTree {
	title: string;
	href: string;
	children: Array<TOCTree>;
}

function mapNode(node: ListItemNode): TOCTree {
	return {
		title: node.children[0].children[0].children[0].value,
		href: node.children[0].children[0].url,
		children: (node.children[1]?.children ?? []).map(mapNode),
	};
}

export const SolidBaseTOC = "$$SolidBase_TOC";

export type TOCOptions = {
	minDepth?: Options["minDepth"];
	maxDepth?: Options["maxDepth"];
};

export function remarkTOC(opts?: TOCOptions) {
	return (tree: any) => {
		const map = toc(tree, {
			ordered: true,
			minDepth: opts?.minDepth ?? 1,
			maxDepth: opts?.maxDepth ?? 4,
			parents: (a) => a.type === "root" || a.type === "mdxJsxFlowElement",
		}).map as PhrasingContent | undefined;

		let value: string;

		if (!map) {
			value = "undefined";
		} else {
			map.data ??= {};
			map.data.hProperties ??= {};
			map.data.hProperties["data-toc"] = "";

			findAndReplace(tree, [["[[toc]]", () => map]]);

			// @ts-ignore: not sure what the correct type is
			value = JSON.stringify(map.children.map(mapNode));
		}

		tree.children.unshift({
			type: "mdxjsEsm",
			value: "",
			data: {
				estree: fromJs(`const ${SolidBaseTOC} = ${value};`, {
					module: true,
				}),
			},
		});
	};
}
