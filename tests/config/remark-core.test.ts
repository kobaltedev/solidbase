import { describe, expect, it } from "vitest";

import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { VFile } from "vfile";

import { remarkAddClass } from "../../src/config/remark-plugins/kbd.ts";
import {
	type FrontmatterRoot,
	remarkMdxFrontmatter,
} from "../../src/config/remark-plugins/mdx-frontmatter.ts";
import { remarkSteps } from "../../src/config/remark-plugins/steps.ts";

async function runMarkdown(markdown: string, ...plugins: Array<any>) {
	const processor = unified().use(remarkParse).use(remarkMdx);
	for (const plugin of plugins) {
		if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1]);
		else processor.use(plugin);
	}
	const file = new VFile({ value: markdown, path: "/tmp/test.mdx" });
	const tree = processor.parse(file);
	return processor.run(tree, file);
}

describe("remarkSteps", () => {
	it("groups consecutive numbered headings into a Steps container", async () => {
		const tree: any = await runMarkdown(
			[
				"## 1. Install",
				"",
				"Install the package.",
				"",
				"## 2. Configure",
				"",
				"Add config.",
			].join("\n"),
			remarkSteps,
		);

		const steps = tree.children[0];
		expect(steps.type).toBe("mdxJsxFlowElement");
		expect(steps.name).toBe("Steps");
		expect(steps.children).toHaveLength(2);
		expect(steps.children[0].name).toBe("Step");
		expect(steps.children[0].children[0].children[0].value).toBe("Install");
		expect(steps.children[1].children[1].children[0].value).toBe("Add config.");
	});

	it("stops grouping when numbering breaks or heading depth changes", async () => {
		const tree: any = await runMarkdown(
			[
				"## 1. First",
				"",
				"## 3. Skipped",
				"",
				"### 4. Nested",
				"",
				"## Not a step",
			].join("\n"),
			remarkSteps,
		);

		expect(tree.children[0].name).toBe("Steps");
		expect(tree.children[0].children).toHaveLength(1);
		expect(tree.children[1].name).toBe("Steps");
		expect(tree.children[1].children).toHaveLength(1);
		expect(tree.children[2].type).toBe("heading");
		expect(tree.children[2].children[0].value).toBe("Not a step");
	});
});

describe("remarkAddClass", () => {
	it("adds sb-kbd class when missing", async () => {
		const tree: any = await runMarkdown(
			"Press <kbd>Enter</kbd>",
			remarkAddClass,
		);
		const kbd = tree.children[0].children[1];

		expect(kbd.attributes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "class", value: "sb-kbd" }),
			]),
		);
	});

	it("appends sb-kbd to an existing class", async () => {
		const tree: any = await runMarkdown(
			'Press <kbd class="hotkey">Enter</kbd>',
			remarkAddClass,
		);
		const kbd = tree.children[0].children[1];

		expect(kbd.attributes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "class", value: "hotkey sb-kbd" }),
			]),
		);
	});
});

describe("remarkMdxFrontmatter", () => {
	it("parses yaml frontmatter into exports and ast data", async () => {
		const tree = (await runMarkdown(
			["---", "title: Hello", "count: 3", "---", "", "# Heading"].join("\n"),
			[remarkFrontmatter, ["yaml", "toml"]],
			remarkMdxFrontmatter,
		)) as FrontmatterRoot;
		const exportNode = tree.children.find(
			(child: any) => child.type === "mdxjsEsm",
		);

		expect(tree.data?.frontmatter).toEqual({ title: "Hello", count: 3 });
		expect(exportNode?.type).toBe("mdxjsEsm");
		expect(JSON.stringify((exportNode as any).data.estree)).toContain(
			"frontmatter",
		);
	});

	it("supports toml and custom export names", async () => {
		const tree = (await runMarkdown(
			["+++", 'title = "Hello"', "enabled = true", "+++", "", "# Heading"].join(
				"\n",
			),
			[remarkFrontmatter, ["yaml", "toml"]],
			[remarkMdxFrontmatter, { name: "meta" }],
		)) as FrontmatterRoot;
		const exportNode = tree.children.find(
			(child: any) => child.type === "mdxjsEsm",
		);

		expect(tree.data?.frontmatter).toEqual({ title: "Hello", enabled: true });
		expect(exportNode?.type).toBe("mdxjsEsm");
		expect(JSON.stringify((exportNode as any).data.estree)).toContain("meta");
	});

	it("defaults to an empty frontmatter object when none exists", async () => {
		const tree = (await runMarkdown(
			"# Heading",
			remarkMdxFrontmatter,
		)) as FrontmatterRoot;

		expect(tree.data?.frontmatter).toEqual({});
		expect(JSON.stringify((tree.children[0] as any).data.estree)).toContain(
			"frontmatter",
		);
	});
});
