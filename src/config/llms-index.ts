import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

import matter from "gray-matter";

import { toDocumentMarkdown } from "./document-markdown.js";
import type { SolidBaseResolvedConfig } from "./index.js";
import type { SidebarConfig } from "./sidebar.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);

type LlmFrontmatter = {
	title?: string;
	description?: string;
	llms?: false | { exclude?: boolean };
};

type SidebarItem = {
	title: string;
	link?: string;
	items?: SidebarItem[];
};

export type LlmDocument = {
	title: string;
	description?: string;
	routePath: string;
	markdownPath: string;
	content: string;
};

function getRoutesDir(root: string) {
	return join(root, "src/routes");
}

function isExcluded(frontmatter: LlmFrontmatter) {
	return frontmatter.llms === false || frontmatter.llms?.exclude === true;
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
			if (!MARKDOWN_EXTENSIONS.has(extname(entry.name))) return [];

			return [fullPath];
		}),
	);

	return files.flat().sort((a, b) => a.localeCompare(b));
}

function toRoutePath(routesDir: string, filePath: string) {
	const relativePath = relative(routesDir, filePath).replace(/\\/g, "/");
	const routePath = relativePath.replace(/\.(md|mdx)$/, "");

	if (routePath === "index") return "/";
	if (routePath.endsWith("/index")) {
		return `/${routePath.slice(0, -"/index".length)}`;
	}

	return `/${routePath}`;
}

export function toMarkdownPath(routePath: string) {
	if (routePath === "/") return "/index.md";
	return `${routePath}.md`;
}

function getRootSidebarItems(sidebar: SidebarConfig<SidebarItem> | undefined) {
	if (!sidebar) return [];
	if (Array.isArray(sidebar)) return sidebar;
	return sidebar["/"] ?? [];
}

function getSidebar(config: SolidBaseResolvedConfig<any>) {
	const themeConfig = config.themeConfig;

	if (
		themeConfig &&
		typeof themeConfig === "object" &&
		"sidebar" in themeConfig
	) {
		return themeConfig.sidebar as SidebarConfig<SidebarItem> | undefined;
	}

	return undefined;
}

export async function getLlmDocuments(
	root: string,
	config: SolidBaseResolvedConfig<any>,
) {
	if (!config.llms) return [];

	const routesDir = getRoutesDir(root);
	const markdownFiles = await collectMarkdownFiles(routesDir);

	return Promise.all(
		markdownFiles.map(async (filePath) => {
			const source = await readFile(filePath, "utf8");
			const { data } = matter(source);
			const frontmatter = data as LlmFrontmatter;

			if (isExcluded(frontmatter)) return null;

			const routePath = toRoutePath(routesDir, filePath);

			return {
				title:
					typeof frontmatter.title === "string" ? frontmatter.title : routePath,
				description:
					typeof frontmatter.description === "string"
						? frontmatter.description
						: undefined,
				routePath,
				markdownPath: toMarkdownPath(routePath),
				content: await toDocumentMarkdown(source, {
					config,
					filePath,
				}),
			} satisfies LlmDocument;
		}),
	).then((documents) => documents.filter((document) => document !== null));
}

function toDocumentHref(markdownPath: string, origin?: string) {
	if (!origin) return markdownPath;
	return new URL(markdownPath, origin).toString();
}

export function buildLlmsIndex(
	origin: string | undefined,
	config: SolidBaseResolvedConfig<any>,
	documents: LlmDocument[],
) {
	const byRoutePath = new Map(
		documents.map((document) => [document.routePath, document] as const),
	);

	const renderItem = (item: SidebarItem): string[] => {
		if (item.link) {
			const document = byRoutePath.get(item.link);
			if (!document) return [];

			const description = document.description
				? `: ${document.description}`
				: "";

			return [
				`- [${item.title}](${toDocumentHref(document.markdownPath, origin)})${description}`,
			];
		}

		return (item.items ?? []).flatMap(renderItem);
	};

	const sidebar = getSidebar(config);
	const sections = getRootSidebarItems(sidebar)
		.map((section) => {
			const lines = renderItem(section);
			if (lines.length === 0) return null;

			return [`## ${section.title}`, "", ...lines].join("\n");
		})
		.filter((section): section is string => section !== null)
		.join("\n\n");

	const fallbackSections = documents
		.map((document) => {
			const description = document.description
				? `: ${document.description}`
				: "";
			return `- [${document.title}](${toDocumentHref(document.markdownPath, origin)})${description}`;
		})
		.join("\n");

	return [
		`# ${config.title}`,
		"",
		config.description,
		"",
		sections || fallbackSections,
	].join("\n");
}

export function getDocumentByPath(documents: LlmDocument[], pathname: string) {
	return documents.find((document) => document.markdownPath === pathname);
}
