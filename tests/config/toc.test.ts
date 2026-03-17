import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
	remarkTOC,
	SolidBaseTOC,
	type TOCOptions,
} from "../../src/config/remark-plugins/toc.ts";

async function transform(markdown: string, opts?: TOCOptions) {
	const processor = unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(remarkTOC, opts);
	const tree = processor.parse(markdown);
	return processor.run(tree);
}

describe("remarkTOC", () => {
	it("replaces [[toc]] with a generated list and exports toc data", async () => {
		const tree: any = await transform(
			["# Intro", "", "[[toc]]", "", "## Install", "", "### CLI"].join("\n"),
		);

		expect(tree.children[0].type).toBe("mdxjsEsm");
		expect(JSON.stringify(tree.children[0].data.estree)).toContain(
			SolidBaseTOC,
		);
		expect(JSON.stringify(tree.children[0].data.estree)).toContain(
			'"value":"Install"',
		);
		expect(JSON.stringify(tree)).toContain('"data-toc":""');
		expect(JSON.stringify(tree)).toContain('"type":"list"');
	});

	it("respects heading depth limits", async () => {
		const tree: any = await transform(
			["# Intro", "", "[[toc]]", "", "## Install", "", "### CLI"].join("\n"),
			{ minDepth: 2, maxDepth: 2 },
		);

		expect(JSON.stringify(tree.children[0].data.estree)).toContain(
			'"value":"Install"',
		);
		expect(JSON.stringify(tree.children[0].data.estree)).not.toContain(
			'"value":"CLI"',
		);
	});
});
