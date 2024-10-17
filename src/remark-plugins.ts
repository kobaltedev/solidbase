import { fromJs } from "esast-util-from-js";
import { h } from "hastscript";
import { findAndReplace } from "mdast-util-find-and-replace";
import { toc } from "mdast-util-toc";
import { visit } from "unist-util-visit";

interface ParagraphNode {
	type: "paragraph";
	url: string;
	children: [
		{
			type: "link";
			url: string;
			children: [
				{
					type: "text";
					value: string;
				},
			];
		},
	];
}

interface ListItemNode {
	type: "listItem";
	children: [
		ParagraphNode,
		(
			| {
					type: "list";
					children: Array<ListItemNode>;
			  }
			| undefined
		),
	];
}

interface TOCTree {
	title: string;
	url: string;
	children: Array<TOCTree>;
}

function mapNode(node: ListItemNode): TOCTree {
	return {
		title: node.children[0].children[0].children[0].value,
		url: node.children[0].children[0].url,
		children: (node.children[1]?.children ?? []).map(mapNode),
	};
}

export function remarkTOC() {
	return (tree: any) => {
		const map = toc(tree, { ordered: true, maxDepth: 3 }).map as any;
		map.data ??= {};
		map.data.hProperties ??= {};
		map.data.hProperties["data-toc"] = "";

		findAndReplace(tree, [
			[
				"[[toc]]",
				() => {
					return map;
				},
			],
		]);

		tree.children.unshift({
			type: "mdxjsEsm",
			value: "",
			data: {
				estree: fromJs(
					`export const $$SolidBase_TOC = ${JSON.stringify(mapNode(map.children[0]))};`,
					{ module: true },
				),
			},
		});
	};
}

const customContainers = new Set([
	"info",
	"note",
	"tip",
	"important",
	"warning",
	"danger",
	"caution",
	"details",
]);

export function remarkGithubAlertsToDirectives() {
	return (tree: any) => {
		visit(tree, (node) => {
			if (node.type !== "blockquote") return;

			const text: string | undefined = node.children?.[0]?.children?.[0]?.value;
			if (!text) return;
			const matches = text.match(/^\[!(\w+)]/);
			if (!matches) return;
			const key = matches[1];
			if (!key) return;
			const directive = key.toLowerCase();

			node.children[0].children[0].value = text.slice(matches[0].length);

			Object.assign(node, {
				type: "containerDirective",
				name: directive,
				children: node.children,
			});
		});
	};
}

export function remarkCustomContainers() {
	return (tree: any) => {
		visit(tree, (node) => {
			if (
				node.type === "containerDirective" ||
				node.type === "leafDirective" ||
				node.type === "textDirective"
			) {
				if (!customContainers.has(node.name)) return;
				const maybeLabel = node.children[0];
				const hasLabel = maybeLabel.data?.directiveLabel;

				let labelText = undefined;

				if (hasLabel) {
					const maybeLabelElement = maybeLabel.children[0];
					if (maybeLabelElement.type === "text") {
						labelText = maybeLabelElement.value;
						(node.children as any[]).shift();
					}
				}

				const data = node.data || (node.data = {});

				const attributes = node.attributes || {};
				attributes.type = node.name;
				attributes.title = labelText;

				data.hName = "$$SolidBase_CustomContainer";
				data.hProperties = h(
					"$$SolidBase_CustomContainer",
					attributes,
				).properties;
			}
		});
	};
}

export function remarkRelativeImports() {
	return (tree: any) => {
		visit(tree, (node) => {
			if (node.type !== "image") return;

			const { url } = node;
			if (!(url.startsWith("./") || url.startsWith("../"))) return;

			const ident = `$$SolidBase_RelativeImport${tree.children.length}`;

			node.url = ident;

			tree.children.push({
				type: "mdxjsEsm",
				value: "",
				data: {
					estree: fromJs(`import ${ident} from "${url}"`, { module: true }),
				},
			});
		});
	};
}
