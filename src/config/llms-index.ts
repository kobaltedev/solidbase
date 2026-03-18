import { readdir, readFile } from "node:fs/promises";
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

type NavItem = {
	text: string;
	link?: string;
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

function isNotFoundRoute(routesDir: string, filePath: string) {
	const relativePath = relative(routesDir, filePath).replace(/\\/g, "/");
	return relativePath
		.split("/")
		.some((segment) => segment.startsWith("[...404]."));
}

function stripOrderingSegment(segment: string) {
	return segment.replace(/^\(\d+\)/, "");
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
	const routePath = relativePath
		.replace(/\.(md|mdx)$/, "")
		.split("/")
		.map(stripOrderingSegment)
		.join("/");

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

function getNav(config: SolidBaseResolvedConfig<any>) {
	const themeConfig = config.themeConfig;

	if (themeConfig && typeof themeConfig === "object" && "nav" in themeConfig) {
		return themeConfig.nav as NavItem[] | undefined;
	}

	return undefined;
}

function joinRoutePath(basePath: `/${string}`, link: string) {
	if (link === "/") return basePath;
	if (link.startsWith(`${basePath}/`) || link === basePath) return link;
	if (!link.startsWith("/")) return `${basePath}/${link}`.replaceAll("//", "/");
	return `${basePath}${link}`.replaceAll("//", "/");
}

function resolveSidebarItems(
	items: SidebarItem[],
	basePath?: `/${string}`,
): SidebarItem[] {
	return items.map((item) => ({
		...item,
		link: item.link
			? basePath
				? joinRoutePath(basePath, item.link)
				: item.link
			: undefined,
		items: item.items ? resolveSidebarItems(item.items, basePath) : undefined,
	}));
}

function normalizeLocalePrefix(prefix: string) {
	if (prefix === "/") return "/";
	return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
}

function getNonRootLocalePrefixes(config: SolidBaseResolvedConfig<any>) {
	return Object.entries(config.locales ?? {})
		.filter(([locale]) => locale !== "root")
		.map(([locale, localeConfig]) =>
			normalizeLocalePrefix(localeConfig.link ?? `/${locale}/`),
		);
}

function isDefaultLocaleRoute(
	routePath: string,
	config: SolidBaseResolvedConfig<any>,
) {
	const localePrefixes = getNonRootLocalePrefixes(config);

	return !localePrefixes.some(
		(prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
	);
}

export async function getLlmDocuments(
	root: string,
	config: SolidBaseResolvedConfig<any>,
): Promise<LlmDocument[]> {
	if (!config.llms) return [];

	const routesDir = getRoutesDir(root);
	const markdownFiles = await collectMarkdownFiles(routesDir);

	return Promise.all(
		markdownFiles.map(async (filePath): Promise<LlmDocument | null> => {
			if (isNotFoundRoute(routesDir, filePath)) return null;

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

function addHeadingSpacing(lines: string[]) {
	const spaced: string[] = [];

	for (const line of lines) {
		if (line.startsWith("#") && spaced.at(-1) && spaced.at(-1) !== "") {
			spaced.push("");
		}

		spaced.push(line);
	}

	return spaced;
}

export function buildLlmsIndex(
	origin: string | undefined,
	config: SolidBaseResolvedConfig<any>,
	documents: LlmDocument[],
) {
	const defaultLocaleDocuments = documents.filter((document) =>
		isDefaultLocaleRoute(document.routePath, config),
	);
	const indexDocuments =
		defaultLocaleDocuments.length > 0 ? defaultLocaleDocuments : documents;

	const byRoutePath = new Map(
		indexDocuments.map((document) => [document.routePath, document] as const),
	);
	const renderedRoutePaths = new Set<string>();

	const renderItem = (item: SidebarItem, headingLevel: number): string[] => {
		const children = (item.items ?? []).flatMap((child) =>
			renderItem(child, Math.min(headingLevel + 1, 6)),
		);

		if (item.link) {
			const document = byRoutePath.get(item.link);
			if (!document) return children;
			renderedRoutePaths.add(document.routePath);

			const description = document.description
				? `: ${document.description}`
				: "";

			return [
				`- [${item.title}](${toDocumentHref(document.markdownPath, origin)})${description}`,
				...children,
			];
		}

		if (children.length === 0) return [];

		return [`${"#".repeat(headingLevel)} ${item.title}`, "", ...children];
	};

	const sidebar = getSidebar(config);
	const nav = getNav(config);
	const keyedSidebar =
		sidebar && !Array.isArray(sidebar)
			? (sidebar as Record<`/${string}`, SidebarItem[]>)
			: undefined;
	const rootSectionEntries = resolveSidebarItems(
		getRootSidebarItems(sidebar),
	).map((item) => ({
		title: item.title,
		items:
			item.items ?? (item.link ? [{ title: item.title, link: item.link }] : []),
	}));
	const sectionEntries = Array.isArray(sidebar)
		? rootSectionEntries
		: (nav
				?.filter((item): item is NavItem & { link: `/${string}` } =>
					Boolean(item.link && keyedSidebar?.[item.link as `/${string}`]),
				)
				.map((item) => ({
					title: item.text,
					items: resolveSidebarItems(
						keyedSidebar?.[item.link] ?? [],
						item.link,
					),
				})) ?? rootSectionEntries);

	const sections = sectionEntries
		.map((section) => {
			const lines = addHeadingSpacing(
				section.items.flatMap((item: SidebarItem) => renderItem(item, 3)),
			);
			if (lines.length === 0) return null;

			return [`## ${section.title}`, "", ...lines].join("\n");
		})
		.filter((section): section is string => section !== null)
		.join("\n\n");

	const topLevelDocuments = indexDocuments
		.filter((document) => !renderedRoutePaths.has(document.routePath))
		.map((document) => {
			const description = document.description
				? `: ${document.description}`
				: "";
			return `- [${document.title}](${toDocumentHref(document.markdownPath, origin)})${description}`;
		})
		.join("\n");

	const fallbackSections = indexDocuments
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
		topLevelDocuments && sections
			? `${topLevelDocuments}\n\n${sections}`
			: topLevelDocuments || sections || fallbackSections,
	].join("\n");
}

export function getDocumentByPath(documents: LlmDocument[], pathname: string) {
	return documents.find((document) => document.markdownPath === pathname);
}
