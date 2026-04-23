import remarkDirective from "remark-directive";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import { remarkCodeTabs } from "../../src/config/remark-plugins/code-tabs.ts";
import { remarkDirectiveContainers } from "../../src/config/remark-plugins/directives.ts";
import { remarkPreview } from "../../src/config/remark-plugins/preview.ts";
import { remarkTabGroup } from "../../src/config/remark-plugins/tab-group.ts";

async function transformPreview(markdown: string) {
	const processor = unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(remarkDirective)
		.use(remarkCodeTabs, { withTsJsToggle: false })
		.use(remarkTabGroup)
		.use(remarkPreview);

	const tree = processor.parse(markdown);
	return processor.run(tree);
}

describe("remarkPreview", () => {
	it("wraps preview-only content in a Preview and PreviewStage", async () => {
		const tree: any = await transformPreview(
			[":::preview", "<Button />", ":::"].join("\n"),
		);

		const preview = tree.children[0];
		expect(preview.type).toBe("mdxJsxFlowElement");
		expect(preview.name).toBe("Preview");
		expect(preview.children).toHaveLength(1);
		expect(preview.children[0].name).toBe("PreviewStage");
		expect(preview.children[0].children[0].name).toBe("Button");
	});

	it("splits preview content on the first top-level divider", async () => {
		const tree: any = await transformPreview(
			[
				":::preview",
				"<Button />",
				"",
				"---",
				"",
				'```tsx tab title="index.tsx"',
				"const Button = () => null;",
				"```",
				"",
				'```css tab title="style.css"',
				".button {}",
				"```",
				":::",
			].join("\n"),
		);

		const preview = tree.children[0];
		expect(preview.children).toHaveLength(2);
		expect(preview.children[0].name).toBe("PreviewStage");
		expect(preview.children[1].name).toBe("PreviewPanel");
		expect(preview.children[1].children[0].type).toBe("containerDirective");
		expect(preview.children[1].children[0].name).toBe("tab-group");
	});

	it("only treats top-level dividers as structural", async () => {
		const tree: any = await transformPreview(
			[":::preview", ":::details", "---", ":::", ":::"].join("\n"),
		);

		const preview = tree.children[0];
		expect(preview.children).toHaveLength(1);
		expect(preview.children[0].name).toBe("PreviewStage");
		expect(preview.children[0].children[0].name).toBe("details");
	});

	it("still allows later directive conversion inside preview slots", async () => {
		const processor = unified()
			.use(remarkParse)
			.use(remarkDirective)
			.use(remarkPreview)
			.use(remarkDirectiveContainers);
		const tree: any = await processor.run(
			processor.parse(
				[":::preview", ":::note", "Body", ":::", ":::"].join("\n"),
			),
		);

		const preview = tree.children[0];
		expect(preview.name).toBe("Preview");
		expect(preview.children[0].children[0].name).toBe("DirectiveContainer");
		expect(preview.children[0].children[0].attributes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "type", value: "note" }),
			]),
		);
	});

	it("rejects empty preview stages", async () => {
		await expect(
			transformPreview([":::preview", "---", "Body", ":::"].join("\n")),
		).rejects.toThrow(
			"preview directives must have content before the divider",
		);
	});

	it("rejects empty preview panels", async () => {
		await expect(
			transformPreview([":::preview", "Body", "", "---", ":::"].join("\n")),
		).rejects.toThrow("preview directives must have content after the divider");
	});
});
