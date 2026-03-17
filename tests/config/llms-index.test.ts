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
});
