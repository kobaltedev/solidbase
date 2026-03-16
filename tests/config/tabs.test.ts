import { describe, expect, it } from "vitest";

import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkCodeTabs } from "../../src/config/remark-plugins/code-tabs.ts";
import { remarkPackageManagerTabs } from "../../src/config/remark-plugins/package-manager-tabs.ts";
import { remarkTabGroup } from "../../src/config/remark-plugins/tab-group.ts";

async function transformCodeTabs(markdown: string, withTsJsToggle = false) {
	const processor = unified().use(remarkParse).use(remarkCodeTabs, {
		withTsJsToggle,
	});
	const tree = processor.parse(markdown);
	return processor.run(tree);
}

async function transformPackageTabs(markdown: string, options?: any) {
	const processor = unified()
		.use(remarkParse)
		.use(remarkPackageManagerTabs, options);
	const tree = processor.parse(markdown);
	return processor.run(tree);
}

describe("tab-related remark plugins", () => {
	it("groups adjacent tabbed code fences into a tab-group container", async () => {
		const tree: any = await transformCodeTabs(
			[
				'```ts tab="install" title="npm"',
				"npm install solidbase",
				"```",
				'```ts tab="install" title="pnpm"',
				"pnpm add solidbase",
				"```",
			].join("\n"),
			true,
		);

		const group = tree.children[0];
		expect(group.type).toBe("containerDirective");
		expect(group.name).toBe("tab-group");
		expect(group.attributes).toMatchObject({
			codeGroup: "true",
			title: "install",
			withTsJsToggle: "true",
		});
		expect(group.children).toHaveLength(2);
		expect(group.children[0].children[1].meta).toContain('frame="none"');
		expect(group.children[1].children[0].children[0].value).toBe("pnpm");
	});

	it("creates package-manager tabs from package-* code fences", async () => {
		const tree: any = await transformPackageTabs(
			"```package-install\nsolidbase@latest\n```",
			{
				show: ["npm", "pnpm"],
				default: "pnpm",
			},
		);

		const group = tree.children[0];
		expect(group.name).toBe("tab-group");
		expect(group.attributes.title).toBe("package-manager");
		expect(group.children[0].children[1].value).toContain(
			"npm i solidbase@latest",
		);
		expect(group.children[1].children[1].value).toContain("pnpm add solidbase");
	});

	it("annotates tab groups with ordered tab names", async () => {
		const tree: any = {
			type: "root",
			children: [
				{
					type: "containerDirective",
					name: "tab-group",
					attributes: {},
					children: [
						{
							type: "containerDirective",
							name: "tab",
							attributes: {},
							children: [
								{
									type: "paragraph",
									data: { directiveLabel: true },
									children: [{ type: "text", value: "Alpha" }],
								},
							],
						},
						{
							type: "containerDirective",
							name: "tab",
							attributes: {},
							children: [
								{
									type: "paragraph",
									data: { directiveLabel: true },
									children: [{ type: "text", value: "Beta" }],
								},
							],
						},
					],
				},
			],
		};

		remarkTabGroup()(tree);

		expect(tree.children[0].attributes.tabNames).toBe("Alpha\0Beta");
		expect(tree.children[0].children).toHaveLength(2);
	});
});
