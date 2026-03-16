import { describe, expect, it } from "vitest";

import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkImportCodeFile } from "../../src/config/remark-plugins/import-code-file.ts";
import { routeFixturePath } from "../helpers/fixtures.ts";

async function transform(
	markdown: string,
	filePath = routeFixturePath("index.mdx"),
) {
	const processor = unified().use(remarkParse).use(remarkImportCodeFile);
	const tree = processor.parse(markdown);
	return processor.run(tree, { path: filePath, value: markdown });
}

describe("remarkImportCodeFile", () => {
	it("inlines imported code and annotates title metadata", async () => {
		const codePath = routeFixturePath("..", "..", "code", "example.ts");
		const tree: any = await transform(`\`\`\`ts file=\"${codePath}\"\n\`\`\``);
		const code = tree.children[0];

		expect(code.lang).toBe("ts");
		expect(code.meta).toContain('title="example.ts"');
		expect(code.value).toContain('console.log("hi");');
		expect(code.value).toContain('console.log("bye");');
	});

	it("supports line ranges and strips redundant indentation", async () => {
		const codePath = routeFixturePath("..", "..", "code", "example.ts");
		const tree: any = await transform(
			`\`\`\`ts file=\"${codePath}#L2-L3\"\n\`\`\``,
		);
		const code = tree.children[0];

		expect(code.value).toBe('console.log("hi");\nconsole.log("bye");');
	});

	it("allows custom transforms before line extraction", async () => {
		const codePath = routeFixturePath("..", "..", "code", "example.ts");
		const processor = unified()
			.use(remarkParse)
			.use(remarkImportCodeFile, {
				transform: (code) => code.replace("bye", "see ya"),
			});
		const markdown = `\`\`\`ts file=\"${codePath}#L2-L3\"\n\`\`\``;
		const tree: any = await processor.run(processor.parse(markdown), {
			path: routeFixturePath("index.mdx"),
			value: markdown,
		});

		expect(tree.children[0].value).toContain('console.log("see ya");');
	});

	it("throws for missing files so broken imports are visible", async () => {
		const missingPath = routeFixturePath("..", "..", "code", "missing.ts");

		await expect(
			transform(`\`\`\`ts file=\"${missingPath}\"\n\`\`\``),
		).rejects.toThrow(/missing\.ts|ENOENT/);
	});

	it("returns an empty snippet for out-of-range line selections", async () => {
		const codePath = routeFixturePath("..", "..", "code", "example.ts");
		const tree: any = await transform(
			`\`\`\`ts file=\"${codePath}#L99-L100\"\n\`\`\``,
		);

		expect(tree.children[0].value).toBe("");
	});
});
