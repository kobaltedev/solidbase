import { describe, expect, it } from "vitest";

import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkDirectiveContainers } from "../../src/config/remark-plugins/directives.ts";
import { remarkGithubAlertsToDirectives } from "../../src/config/remark-plugins/gh-directives.ts";
import { remarkIssueAutolink } from "../../src/config/remark-plugins/issue-autolink.ts";
import { remarkRelativeImports } from "../../src/config/remark-plugins/relative-imports.ts";

async function run(markdown: string, ...plugins: Array<any>) {
	const processor = unified().use(remarkParse);
	for (const plugin of plugins) {
		if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1]);
		else processor.use(plugin);
	}
	const tree = processor.parse(markdown);
	return processor.run(tree);
}

describe("misc remark plugins", () => {
	it("converts github alert blockquotes into directive containers", async () => {
		const tree: any = await run(
			["> [!NOTE]", "> Heads up"].join("\n"),
			remarkGithubAlertsToDirectives,
			remarkDirectiveContainers,
		);

		expect(tree.children[0].type).toBe("mdxJsxFlowElement");
		expect(tree.children[0].name).toBe("DirectiveContainer");
		expect(tree.children[0].attributes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "type", value: "note" }),
			]),
		);
	});

	it("rewrites relative image imports into MDX imports", async () => {
		const tree: any = await run("![Logo](./logo.png)", remarkRelativeImports);

		expect(tree.children[0].children[0].url).toMatch(
			/^\$\$SolidBase_RelativeImport/,
		);
		expect(tree.children[1].type).toBe("mdxjsEsm");
		expect(JSON.stringify(tree.children[1].data.estree)).toContain(
			"./logo.png",
		);
	});

	it("autolinks issue references using the configured template", async () => {
		const tree: any = await run("Fixes #123", [
			remarkIssueAutolink,
			"https://example.com/issues/:issue",
		]);

		expect(tree.children[0].children).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: "link",
					url: "https://example.com/issues/123",
				}),
			]),
		);
	});

	it("converts directive syntax into DirectiveContainer JSX", async () => {
		const processor = unified()
			.use(remarkParse)
			.use(remarkDirective)
			.use(remarkDirectiveContainers);
		const markdown = [":::note[Custom title]", "Body", ":::"].join("\n");
		const tree: any = await processor.run(processor.parse(markdown));

		expect(tree.children[0].type).toBe("mdxJsxFlowElement");
		expect(tree.children[0].attributes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "type", value: "note" }),
				expect.objectContaining({ name: "title", value: "Custom title" }),
			]),
		);
	});
});
