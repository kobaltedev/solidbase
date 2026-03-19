import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
	getRoutesIndex,
	isDefaultLocaleRoute,
} from "../../src/config/routes-index.ts";

import { fixtureSiteRoot } from "../helpers/fixtures.ts";

describe("getRoutesIndex", () => {
	it("indexes markdown routes with normalized paths and frontmatter", async () => {
		const routes = await getRoutesIndex(fixtureSiteRoot);

		expect(
			routes.map(({ routePath, markdownPath, frontmatter }) => ({
				routePath,
				markdownPath,
				title: frontmatter.title,
			})),
		).toEqual([
			{
				routePath: "/excluded",
				markdownPath: "/excluded.md",
				title: "Hidden Doc",
			},
			{
				routePath: "/guide/getting-started",
				markdownPath: "/guide/getting-started.md",
				title: "Getting Started",
			},
			{
				routePath: "/",
				markdownPath: "/index.md",
				title: "Home",
			},
			{
				routePath: "/plain",
				markdownPath: "/plain.md",
				title: undefined,
			},
		]);
	});

	it("skips not-found route files", async () => {
		const root = await mkdtemp(join(tmpdir(), "solidbase-routes-404-"));
		await mkdir(join(root, "src", "routes", "fr"), { recursive: true });

		await writeFile(
			join(root, "src", "routes", "index.mdx"),
			["---", "title: Home", "---", "", "Welcome home."].join("\n"),
		);
		await writeFile(
			join(root, "src", "routes", "[...404].mdx"),
			["---", "title: Not Found", "---", "", "Missing page."].join("\n"),
		);
		await writeFile(
			join(root, "src", "routes", "fr", "[...404].mdx"),
			["---", "title: Introuvable", "---", "", "Page manquante."].join("\n"),
		);

		const routes = await getRoutesIndex(root);

		expect(routes.map((route) => route.routePath)).toEqual(["/"]);
	});

	it("strips numeric ordering prefixes from route paths", async () => {
		const root = await mkdtemp(join(tmpdir(), "solidbase-routes-ordering-"));
		await mkdir(join(root, "src", "routes", "guide", "features"), {
			recursive: true,
		});

		await writeFile(
			join(root, "src", "routes", "guide", "(0)quickstart.mdx"),
			["---", "title: Quick Start", "---", "", "Start here."].join("\n"),
		);
		await writeFile(
			join(root, "src", "routes", "guide", "features", "(3)llms.mdx"),
			["---", "title: LLMs.txt", "---", "", "AI docs."].join("\n"),
		);

		const routes = await getRoutesIndex(root);

		expect(routes.map((route) => route.routePath)).toEqual([
			"/guide/quickstart",
			"/guide/features/llms",
		]);
		expect(routes.map((route) => route.markdownPath)).toEqual([
			"/guide/quickstart.md",
			"/guide/features/llms.md",
		]);
	});
});

describe("isDefaultLocaleRoute", () => {
	it("treats non-root locale prefixes as non-default routes", () => {
		const config = {
			locales: {
				root: { label: "English" },
				fr: { label: "Francais" },
				docs: { label: "Docs", link: "/documentation/" },
			},
		} as any;

		expect(isDefaultLocaleRoute("/", config)).toBe(true);
		expect(isDefaultLocaleRoute("/guide/getting-started", config)).toBe(true);
		expect(isDefaultLocaleRoute("/fr", config)).toBe(false);
		expect(isDefaultLocaleRoute("/fr/guide/getting-started", config)).toBe(
			false,
		);
		expect(isDefaultLocaleRoute("/documentation", config)).toBe(false);
		expect(isDefaultLocaleRoute("/documentation/api", config)).toBe(false);
	});
});
