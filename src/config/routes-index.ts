import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

import matter from "gray-matter";

import type { SolidBaseResolvedConfig } from "./index.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);

export type RouteIndexEntry = {
	filePath: string;
	routePath: string;
	markdownPath: string;
	source: string;
	frontmatter: Record<string, unknown>;
};

export function getRoutesDir(root: string) {
	return join(root, "src/routes");
}

export function isNotFoundRoute(routesDir: string, filePath: string) {
	const relativePath = relative(routesDir, filePath).replace(/\\/g, "/");
	return relativePath
		.split("/")
		.some((segment) => segment.startsWith("[...404]."));
}

export function stripOrderingSegment(segment: string) {
	return segment.replace(/^\(\d+\)/, "");
}

export async function collectMarkdownFiles(dir: string): Promise<string[]> {
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

export function toRoutePath(routesDir: string, filePath: string) {
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

function normalizeLocalePrefix(prefix: string) {
	if (prefix === "/") return "/";
	return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
}

export function getNonRootLocalePrefixes(config: SolidBaseResolvedConfig<any>) {
	return Object.entries(config.locales ?? {})
		.filter(([locale]) => locale !== "root")
		.map(([locale, localeConfig]) =>
			normalizeLocalePrefix(localeConfig.link ?? `/${locale}/`),
		);
}

export function isDefaultLocaleRoute(
	routePath: string,
	config: SolidBaseResolvedConfig<any>,
) {
	const localePrefixes = getNonRootLocalePrefixes(config);

	return !localePrefixes.some(
		(prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
	);
}

export async function getRoutesIndex(root: string): Promise<RouteIndexEntry[]> {
	const routesDir = getRoutesDir(root);
	const markdownFiles = await collectMarkdownFiles(routesDir);

	return Promise.all(
		markdownFiles.map(async (filePath): Promise<RouteIndexEntry | null> => {
			if (isNotFoundRoute(routesDir, filePath)) return null;

			const source = await readFile(filePath, "utf8");
			const { data } = matter(source);
			const routePath = toRoutePath(routesDir, filePath);

			return {
				filePath,
				routePath,
				markdownPath: toMarkdownPath(routePath),
				source,
				frontmatter: data as Record<string, unknown>,
			} satisfies RouteIndexEntry;
		}),
	).then((routes) => routes.filter((route) => route !== null));
}
