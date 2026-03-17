import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildLlmsIndex,
	getDocumentByPath,
	getLlmDocuments,
} from "../../src/config/llms-index.ts";
import { fixtureSiteRoot } from "../helpers/fixtures.ts";

const config = {
	title: "SolidBase Docs",
	description: "Documentation for SolidBase",
	llms: true,
	themeConfig: {
		sidebar: {
			"/": [
				{
					title: "Guide",
					items: [{ title: "Getting Started", link: "/guide/getting-started" }],
				},
			],
		},
	},
	markdown: {},
} as any;

describe("getLlmDocuments", () => {
	it("collects transformed markdown documents and skips excluded files", async () => {
		const documents = await getLlmDocuments(fixtureSiteRoot, config);

		expect(documents.map((document) => document.routePath)).toEqual([
			"/guide/getting-started",
			"/",
			"/plain",
		]);

		expect(documents[1]).toMatchObject({
			title: "Home",
			description: "Welcome home",
			markdownPath: "/index.md",
		});
		expect(documents[1]?.content).toContain("Welcome to SolidBase.");
		expect(documents[1]?.content).toContain(
			"```md\n{frontmatter.product}\n```",
		);
	});

	it("builds llms index content from sidebar metadata", async () => {
		const documents = await getLlmDocuments(fixtureSiteRoot, config);
		const index = buildLlmsIndex("https://solidbase.dev", config, documents);

		expect(index).toContain("# SolidBase Docs");
		expect(index).toContain("## Guide");
		expect(index).toContain(
			"- [Getting Started](https://solidbase.dev/guide/getting-started.md): Learn the basics",
		);
	});

	it("looks up emitted documents by markdown path", async () => {
		const documents = await getLlmDocuments(fixtureSiteRoot, config);

		expect(
			getDocumentByPath(documents, "/guide/getting-started.md"),
		).toMatchObject({
			routePath: "/guide/getting-started",
			title: "Getting Started",
		});
	});

	it("falls back to a flat index when no sidebar is configured", async () => {
		const documents = await getLlmDocuments(fixtureSiteRoot, config);
		const index = buildLlmsIndex(
			undefined,
			{ ...config, themeConfig: {} },
			documents,
		);

		expect(index).toContain(
			"- [Getting Started](/guide/getting-started.md): Learn the basics",
		);
		expect(index).toContain("- [Home](/index.md): Welcome home");
	});

	it("defaults llms.txt to root locale documents when localized routes exist", () => {
		const index = buildLlmsIndex(
			undefined,
			{
				...config,
				themeConfig: {},
				locales: {
					root: { label: "English" },
					fr: { label: "Francais" },
				},
			},
			[
				{
					title: "Home",
					description: "Welcome home",
					routePath: "/",
					markdownPath: "/index.md",
					content: "Home",
				},
				{
					title: "Guide",
					description: "English docs",
					routePath: "/guide/getting-started",
					markdownPath: "/guide/getting-started.md",
					content: "Guide",
				},
				{
					title: "Accueil",
					description: "French docs",
					routePath: "/fr",
					markdownPath: "/fr.md",
					content: "Accueil",
				},
				{
					title: "Demarrage",
					description: "French getting started",
					routePath: "/fr/guide/getting-started",
					markdownPath: "/fr/guide/getting-started.md",
					content: "Demarrage",
				},
			],
		);

		expect(index).toContain("- [Home](/index.md): Welcome home");
		expect(index).toContain(
			"- [Guide](/guide/getting-started.md): English docs",
		);
		expect(index).not.toContain("/fr.md");
		expect(index).not.toContain("/fr/guide/getting-started.md");
	});

	it("renders nav sections and nested sidebar groups as headings", () => {
		const index = buildLlmsIndex(
			undefined,
			{
				...config,
				themeConfig: {
					nav: [
						{ text: "Guide", link: "/guide" },
						{ text: "Reference", link: "/reference" },
					],
					sidebar: {
						"/guide": [
							{ title: "About", link: "/" },
							{
								title: "Customization",
								items: [
									{
										title: "Custom Themes",
										link: "/customization/custom-themes",
									},
								],
							},
							{
								title: "Features",
								items: [
									{
										title: "LLMs.txt",
										link: "/features/llms",
									},
								],
							},
						],
						"/reference": [
							{ title: "Index", link: "/" },
							{ title: "Frontmatter", link: "/frontmatter" },
							{ title: "Runtime API", link: "/runtime-api" },
							{
								title: "Default Theme",
								items: [
									{
										title: "Landing",
										link: "/default-theme/landing",
									},
								],
							},
						],
					},
				},
			},
			[
				{
					title: "About",
					routePath: "/guide",
					markdownPath: "/guide.md",
					content: "About",
				},
				{
					title: "Custom Themes",
					routePath: "/guide/customization/custom-themes",
					markdownPath: "/guide/customization/custom-themes.md",
					content: "Custom Themes",
				},
				{
					title: "LLMs.txt",
					routePath: "/guide/features/llms",
					markdownPath: "/guide/features/llms.md",
					content: "LLMs",
				},
				{
					title: "Index",
					routePath: "/reference",
					markdownPath: "/reference.md",
					content: "Reference",
				},
				{
					title: "Frontmatter",
					routePath: "/reference/frontmatter",
					markdownPath: "/reference/frontmatter.md",
					content: "Frontmatter",
				},
				{
					title: "Runtime API",
					routePath: "/reference/runtime-api",
					markdownPath: "/reference/runtime-api.md",
					content: "Runtime API",
				},
				{
					title: "Landing",
					routePath: "/reference/default-theme/landing",
					markdownPath: "/reference/default-theme/landing.md",
					content: "Landing",
				},
			],
		);

		expect(index).toContain("- [About](/guide.md)");
		expect(index).toContain("## Guide");
		expect(index).toContain("## Reference");
		expect(index).toContain("- [About](/guide.md)");
		expect(index).toContain(
			"### Customization\n\n- [Custom Themes](/guide/customization/custom-themes.md)",
		);
		expect(index).toContain(
			"### Features\n\n- [LLMs.txt](/guide/features/llms.md)",
		);
		expect(index).toContain("- [Index](/reference.md)");
		expect(index).toContain("- [Frontmatter](/reference/frontmatter.md)");
		expect(index).toContain("- [Runtime API](/reference/runtime-api.md)");
		expect(index).toContain(
			"### Default Theme\n\n- [Landing](/reference/default-theme/landing.md)",
		);
	});

	it("uses route path as a title fallback and respects nested llms exclusion", async () => {
		const root = await mkdtemp(join(tmpdir(), "solidbase-llms-"));
		const routesDir = join(root, "src", "routes", "guide");
		await mkdir(routesDir, { recursive: true });

		await writeFile(
			join(root, "src", "routes", "guide", "no-title.mdx"),
			"Paragraph only.",
		);
		await writeFile(
			join(root, "src", "routes", "guide", "excluded.mdx"),
			["---", "llms:", "  exclude: true", "---", "", "Should not appear."].join(
				"\n",
			),
		);

		const documents = await getLlmDocuments(root, {
			...config,
			themeConfig: {},
		});

		expect(documents).toEqual([
			expect.objectContaining({
				title: "/guide/no-title",
				routePath: "/guide/no-title",
				markdownPath: "/guide/no-title.md",
				content: "Paragraph only.",
			}),
		]);
	});

	it("skips not-found route files from llms output", async () => {
		const root = await mkdtemp(join(tmpdir(), "solidbase-llms-404-"));
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

		const documents = await getLlmDocuments(root, {
			...config,
			themeConfig: {},
		});

		expect(documents.map((document) => document.routePath)).toEqual(["/"]);
	});

	it("strips numeric ordering prefixes from llms route paths", async () => {
		const root = await mkdtemp(join(tmpdir(), "solidbase-llms-ordering-"));
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

		const documents = await getLlmDocuments(root, {
			...config,
			themeConfig: {},
		});

		expect(documents.map((document) => document.routePath)).toEqual([
			"/guide/quickstart",
			"/guide/features/llms",
		]);
		expect(documents.map((document) => document.markdownPath)).toEqual([
			"/guide/quickstart.md",
			"/guide/features/llms.md",
		]);
	});
});
