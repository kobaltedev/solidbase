import { fromJs } from "esast-util-from-js";
import { h } from "hastscript";
import { findAndReplace } from "mdast-util-find-and-replace";
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

export const SolidBaseTOC = "$$SolidBase_TOC";

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

		const estree = fromJs(
			`const ${SolidBaseTOC} = ${JSON.stringify(mapNode(map.children[0]))};`,
			{ module: true },
		);

		tree.children.unshift({
			type: "mdxjsEsm",
			value: "",
			data: {
				estree,
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

const customContainers = new Set([
	"info",
	"note",
	"tip",
	"important",
	"warning",
	"danger",
	"caution",
	"details",
	"code-group",
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

				const isCodeGroup = node.name === "code-group";

				const tabs = [];
				if (isCodeGroup) {
					attributes.type = "code-group";

					for (const child of node.children) {
						if (child.type !== "code") continue;
						tabs.push(child.meta);
					}
				}

				data.hName = "$$SolidBase_CustomContainer";
				const element = h("$$SolidBase_CustomContainer", attributes);
				data.hProperties = element.properties;
				if (isCodeGroup) {
					data.hProperties.tabNames = tabs.join("$$BASE$$");
				}
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
