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

	it("keeps object expressions intact and renders missing values as empty text", async () => {
		const source = [
			"---",
			"meta:",
			"  nested: value",
			"---",
			"",
			"Object: {frontmatter.meta}",
			"",
			"Broken: {frontmatter.missing?.value}",
		].join("\n");

		expect(
			await toDocumentMarkdown(source, {
				config: {},
				filePath: routeFixturePath("index.mdx"),
			}),
		).toBe(["Object: {frontmatter.meta}", "", "Broken:"].join("\n"));
	});

	it("matches a representative rendered-markdown fixture", async () => {
		const source = [
			"---",
			"title: Home",
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
			"",
			"```md",
			"{frontmatter.product}",
			"```",
		].join("\n");

		expect(
			await toDocumentMarkdown(source, {
				config: {},
				filePath: routeFixturePath("index.mdx"),
			}),
		).toBe(
			[
				"# Home",
				"",
				"Welcome to SolidBase.",
				"",
				"> Fast docs",
				"",
				"* v3",
				"",
				"SolidBase",
				"",
				"```md",
				"{frontmatter.product}",
				"```",
			].join("\n"),
		);
	});

	it("applies TOC, imported code, and github alert transforms together", async () => {
		const codePath = routeFixturePath("..", "..", "code", "example.ts");
		const source = [
			"---",
			"title: Home",
			"product: SolidBase",
			"---",
			"",
			"# {frontmatter.title}",
			"",
			"[[toc]]",
			"",
			"## Install",
			"",
			"> [!NOTE]",
			"> Welcome to {frontmatter.product}.",
			"",
			`\`\`\`ts file="${codePath}#L2-L3"`,
			"```",
		].join("\n");

		const markdown = await toDocumentMarkdown(source, {
			config: { markdown: { toc: {} } },
			filePath: routeFixturePath("index.mdx"),
		});

		expect(markdown).toContain("# Home");
		expect(markdown).toContain("1. [Install](#install)");
		expect(markdown).toContain("**note**");
		expect(markdown).toContain("Welcome to SolidBase.");
		expect(markdown).toContain('console.log("hi");');
		expect(markdown).not.toContain("DirectiveContainer");
		expect(markdown).not.toContain("mdxJsx");
	});

	it("collapses package manager tabs into a single shell fence", async () => {
		const source = ["```package-install", "solidbase@latest", "```"].join("\n");

		expect(
			await toDocumentMarkdown(source, {
				config: {},
				filePath: routeFixturePath("index.mdx"),
			}),
		).toBe(
			[
				"```sh",
				"npm i solidbase@latest",
				"pnpm add solidbase",
				"yarn add solidbase@latest",
				"bun add solidbase@latest",
				"deno add npm:solidbase@latest",
				"```",
			].join("\n"),
		);
	});

	it("strips remaining mdx jsx and expressions to plain markdown", async () => {
		const source = [
			"{/* prettier-ignore */}",
			"",
			":::note[Heads up]",
			"Use <kbd>Cmd</kbd> + <kbd>K</kbd>.",
			":::",
		].join("\n");

		const markdown = await toDocumentMarkdown(source, {
			config: {},
			filePath: routeFixturePath("index.mdx"),
		});

		expect(markdown).toContain("**Heads up**");
		expect(markdown).toContain("Use Cmd + K.");
		expect(markdown).not.toContain("DirectiveContainer");
		expect(markdown).not.toContain("<kbd>");
		expect(markdown).not.toContain("{/* prettier-ignore */}");
	});
});
