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
});
