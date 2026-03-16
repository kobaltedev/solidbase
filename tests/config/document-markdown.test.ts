import { describe, expect, it } from "vitest";

import { toDocumentMarkdown } from "../../src/config/document-markdown.ts";
import { routeFixturePath } from "../helpers/fixtures.ts";

describe("toDocumentMarkdown", () => {
	it("renders arbitrary frontmatter expressions across markdown content", async () => {
		const source = [
			"---",
			"title: Hello",
			"product: SolidBase",
			"tagline: Fast docs",
			"release: 3",
			"---",
			"",
			"# {frontmatter.title}",
			"",
			"Welcome to {frontmatter.product}.",
			"",
			"> {frontmatter.tagline}",
			"",
			"- v{frontmatter.release}",
			"",
			'{frontmatter["product"]}',
		].join("\n");

		expect(
			await toDocumentMarkdown(source, {
				config: {},
				filePath: routeFixturePath("index.mdx"),
			}),
		).toBe(
			[
				"# Hello",
				"",
				"Welcome to SolidBase.",
				"",
				"> Fast docs",
				"",
				"* v3",
				"",
				"SolidBase",
			].join("\n"),
		);
	});

	it("strips frontmatter metadata and keeps code fences untouched", async () => {
		const source = [
			"---",
			"title: Hello",
			"product: SolidBase",
			"---",
			"",
			"# {frontmatter.title}",
			"",
			"```md",
			"{frontmatter.product}",
			"```",
		].join("\n");

		const markdown = await toDocumentMarkdown(source, {
			config: {},
			filePath: routeFixturePath("index.mdx"),
		});

		expect(markdown).toContain("# Hello");
		expect(markdown).toContain("```md\n{frontmatter.product}\n```");
		expect(markdown).not.toContain("title: Hello");
		expect(markdown).not.toContain("export const frontmatter");
	});

	it("renders scalar values and removes empty flow expressions", async () => {
		const source = [
			"---",
			"count: 3",
			"published: false",
			"tags:",
			"  - docs",
			"  - llms",
			"---",
			"",
			"Count: {frontmatter.count}",
			"",
			"{frontmatter.published}",
			"",
			"{frontmatter.tags}",
		].join("\n");

		expect(
			await toDocumentMarkdown(source, {
				config: {},
				filePath: routeFixturePath("index.mdx"),
			}),
		).toBe(["Count: 3", "", "docsllms"].join("\n"));
	});
});
