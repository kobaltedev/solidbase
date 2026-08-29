import type { Root, RootContent } from "mdast";
import { toString as nodeToString } from "mdast-util-to-string";
import { toc } from "mdast-util-toc";
import type { CustomRecord } from "pagefind";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { toDocumentMarkdown } from "../config/document-markdown.js";
import type { SolidBaseResolvedConfig } from "../config/index.js";
import { viteAliasCodeImports } from "../config/remark-plugins/import-code-file.js";
import {
	getRouteLocaleMetadata,
	getRoutesIndex,
	isRouteIncludedByConfig,
} from "../config/routes-index.js";
import {
	getLocalSearchScopeForPath,
	type LocalSearchSection,
} from "./search.js";

type SearchFrontmatter = {
	title?: string;
	description?: string;
	search?: false;
};

type SearchPage = {
	routePath: string;
	title: string;
	description?: string;
};

type ViteAliasTransformer = {
	transform: (code: string, id: string) => Promise<string | undefined>;
};

function getHeadingAnchors(tree: Root) {
	const anchors: string[] = [];
	const map = toc(tree, { minDepth: 1, maxDepth: 6 }).map;

	if (map) {
		visit(map, "link", (node) => {
			anchors.push(node.url);
		});
	}

	return anchors;
}

function getSearchableText(nodes: RootContent[]) {
	return nodes
		.map((node) => nodeToString(node))
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
}

export function splitSearchSections(
	markdown: string,
	page: SearchPage,
): LocalSearchSection[] {
	const tree = unified().use(remarkParse).use(remarkMdx).parse(markdown);
	const anchors = getHeadingAnchors(tree);
	const documents: LocalSearchSection[] = [];
	const titles: string[] = [];
	let headingIndex = 0;
	let sectionTitle = page.title;
	let sectionTitles: string[] = [];
	let sectionId = page.routePath;
	let sectionNodes: RootContent[] = [];
	let description = page.description;

	const addSection = () => {
		const body = getSearchableText(sectionNodes);
		const text = [description, body].filter(Boolean).join(" ");
		description = undefined;
		documents.push({
			url: sectionId,
			title: sectionTitle,
			titles: sectionTitles,
			content: text,
		});
	};

	for (const node of tree.children) {
		if (node.type !== "heading") {
			sectionNodes.push(node);
			continue;
		}

		if (sectionNodes.length > 0) addSection();

		sectionTitle = nodeToString(node);
		titles.length = node.depth - 1;
		sectionTitles = titles.filter(Boolean);
		titles[node.depth - 1] = sectionTitle;
		sectionId = `${page.routePath}${anchors[headingIndex++] ?? ""}`;
		sectionNodes = [];
	}

	addSection();
	return documents;
}

export async function buildLocalSearchRecords(
	root: string,
	config: SolidBaseResolvedConfig<any>,
	resolver: (
		source: string,
		importer: string,
	) => Promise<{ id: string } | null>,
	onFile?: (filePath: string) => void,
) {
	const records: CustomRecord[] = [];
	const routes = await getRoutesIndex(root);
	const aliasTransformer = viteAliasCodeImports(
		resolver,
	) as ViteAliasTransformer;

	for (const route of routes) {
		onFile?.(route.filePath);
		const frontmatter = route.frontmatter as SearchFrontmatter;
		if (frontmatter.search === false) continue;
		if (!isRouteIncludedByConfig(route.routePath, config)) continue;

		const scope = getLocalSearchScopeForPath(route.routePath, config);
		const language = new Intl.Locale(
			getRouteLocaleMetadata(route.routePath, config).hreflang,
		).language;

		const source =
			(await aliasTransformer.transform(route.source, route.filePath)) ??
			route.source;
		const markdown = await toDocumentMarkdown(source, {
			config,
			filePath: route.filePath,
		});
		records.push(
			...splitSearchSections(markdown, {
				routePath: route.routePath,
				title:
					typeof frontmatter.title === "string"
						? frontmatter.title
						: route.routePath,
				description:
					typeof frontmatter.description === "string"
						? frontmatter.description
						: undefined,
			}).map((section) => ({
				url: section.url,
				content: section.content,
				language,
				meta: {
					title: section.title,
					...(section.titles.length > 0
						? { breadcrumb: section.titles.join(" › ") }
						: {}),
				},
				filters: { scope: [scope] },
			})),
		);
	}

	return records;
}
