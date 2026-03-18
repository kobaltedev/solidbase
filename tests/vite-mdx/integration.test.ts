import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { VFile } from "vfile";
import { describe, expect, it } from "vitest";

import viteMdx from "../../src/vite-mdx/index.ts";
import { createTransformer } from "../../src/vite-mdx/transform.ts";
import { ImportMap } from "../../src/vite-mdx/viteMdxTransclusion/ImportMap.ts";
import { remarkTransclusion } from "../../src/vite-mdx/viteMdxTransclusion/remarkTransclusion.ts";

function appendParagraph(text: string) {
	return () => (tree: any) => {
		tree.children.push({
			type: "paragraph",
			children: [{ type: "text", value: text }],
		});
	};
}

function createStubCompiler() {
	const processor = unified().use(remarkParse).use(remarkMdx);

	return {
		parse(file: { contents: string; path: string }) {
			return processor.parse(
				new VFile({ path: file.path, value: file.contents }),
			);
		},
		async run(tree: any) {
			return tree;
		},
	};
}

describe("vite-mdx integration", () => {
	const pagePath = "tests/fixtures/page.mdx";
	const sharedPath = "tests/fixtures/shared.mdx";

	it("createTransformer prepends imports and transpiles JSX output", async () => {
		const transform = createTransformer(process.cwd(), {});

		const code = await transform("# Hello");

		expect(code).toContain("export default MDXContent; function MDXContent");
		expect(code).toContain('"Hello"');
	});

	it("viteMdx merges global and local remark plugins during transform", async () => {
		const [plugin] = viteMdx.withImports({})((filename) => ({
			remarkPlugins: filename.endsWith("page.mdx")
				? [appendParagraph("local")]
				: [],
		})) as any[];

		plugin.configResolved({
			root: process.cwd(),
			plugins: [],
		} as any);

		plugin.mdxOptions.remarkPlugins.push(appendParagraph("global"));

		const result = await plugin.transform.call({}, "# Hello", pagePath, false);

		expect(result.code).toContain('"global"');
		expect(result.code).toContain('"local"');
	});

	it("remarkTransclusion inlines imported mdx, caches ASTs, and tracks imports", async () => {
		const importMap = new ImportMap();
		const astCache = new Map<string, any[]>();
		const compiler = createStubCompiler();
		let readCount = 0;

		const processor = unified().use(remarkParse).use(remarkMdx);
		const transformTransclusion = (remarkTransclusion as any)({
			astCache: astCache as any,
			importMap,
			resolve: async (id: string) =>
				id === "./shared.mdx" ? sharedPath : undefined,
			readFile: async () => {
				readCount += 1;
				return "## Shared\n\nFrom import.";
			},
			getCompiler: () => compiler as any,
		})();

		const firstFile = new VFile({
			path: pagePath,
			value: 'import "./shared.mdx"\n\n# Page',
		});
		const firstTree: any = processor.parse(firstFile);
		await transformTransclusion(firstTree, firstFile);

		expect(firstTree.children.map((node: any) => node.type)).toEqual([
			"heading",
			"paragraph",
			"heading",
		]);
		expect(firstTree.children[0].children[0].value).toBe("Shared");
		expect(importMap.importers.get(sharedPath)).toEqual(new Set([pagePath]));
		expect(readCount).toBe(1);

		const secondFile = new VFile({
			path: pagePath,
			value: 'import "./shared.mdx"\n\n# Page',
		});
		const secondTree: any = processor.parse(secondFile);
		await transformTransclusion(secondTree, secondFile);

		expect(readCount).toBe(1);
		expect(secondTree.children[0].children[0].value).toBe("Shared");
	});

	it("remarkTransclusion strips unresolved mdx imports", async () => {
		const processor = unified().use(remarkParse).use(remarkMdx);
		const compiler = createStubCompiler();
		const transformTransclusion = (remarkTransclusion as any)({
			resolve: async () => undefined,
			readFile: async () => "",
			getCompiler: () => compiler as any,
		})();

		const file = new VFile({
			path: pagePath,
			value: 'import "./missing.mdx"\n\n# Page',
		});
		const tree: any = processor.parse(file);
		await transformTransclusion(tree, file);

		expect(tree.children).toHaveLength(1);
		expect(tree.children[0].children[0].value).toBe("Page");
	});
});
