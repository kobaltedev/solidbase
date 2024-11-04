import { fromJs } from "esast-util-from-js";
import { findAndReplace } from "mdast-util-find-and-replace";
import type { PhrasingContent } from "mdast-util-find-and-replace/lib";
import { toc } from "mdast-util-toc";
import { u } from "unist-builder";
import { visit } from "unist-util-visit";

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

export function remarkTOC() {
	return (tree: any) => {
		const map = toc(tree, { ordered: true, minDepth: 2, maxDepth: 4 }).map as
			| PhrasingContent
			| undefined;

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

export type IssueAutoLinkConfig = false | string | ((issue: string) => string);
export function remarkIssueAutolink(issueAutolink: IssueAutoLinkConfig) {
	if (issueAutolink === false) return;

	const url = (issue: string) => {
		const number = issue.slice(1);
		if (typeof issueAutolink === "function") return issueAutolink(number);
		return issueAutolink.replace(":issue", number);
	};

	return (tree: any) => {
		findAndReplace(tree, [
			[
				/(?<=(^| ))#\d+/gm,
				(match: string) => {
					return u("link", { url: url(match) }, [u("text", match)]);
				},
			],
			[
				/\\#\d+/g,
				(match: string) => {
					return match.slice(1);
				},
			],
		]);
	};
}

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

export function remarkDirectiveContainers() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (
				node.type === "containerDirective" ||
				node.type === "leafDirective" ||
				node.type === "textDirective"
			) {
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

				const attributes = node.attributes || {};
				attributes.type = node.name;
				attributes.title = labelText;

				const isCodeGroup = node.name === "code-group";

				const tabs = [];
				if (isCodeGroup) {
					attributes.type = "code-group";

					for (const child of node.children) {
						if (child.type !== "code") continue;
						tabs.push(child.meta);
					}
				}

				parent.children[index!] = {
					type: "mdxJsxFlowElement",
					name: "DirectiveContainer",
					children: node.children,
					attributes: Object.entries(attributes)
						.map(([name, value]) => ({ type: "mdxJsxAttribute", name, value }))
						.filter((v) => v.value !== undefined),
				};
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

export function remarkAddClass() {
	return (tree: any) => {
		visit(tree, (node) => {
			if (node.type !== "mdxJsxTextElement" && node.name !== "kbd") return;

			node.attributes ??= [];

			const found = node.attributes.find((attr: any) => attr.name === "class");

			if (found) {
				found.value += " sb-kbd";
			} else {
				node.attributes.push({
					type: "mdxJsxAttribute",
					name: "class",
					value: "sb-kbd",
				});
			}
		});
	};
}
