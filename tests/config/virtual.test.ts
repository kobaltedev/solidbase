import { afterEach, describe, expect, it } from "vitest";

import { transformMdxModule } from "../../src/config/vite-plugin/virtual.ts";
import { routeFixturePath } from "../helpers/fixtures.ts";

describe("transformMdxModule", () => {
	const previousPwd = process.env.PWD;

	afterEach(() => {
		process.env.PWD = previousPwd;
	});

	it("embeds llmText using the same transformed markdown output", async () => {
		const modulePath = routeFixturePath("index.mdx");
		process.env.PWD = "/home/sarah/GitHub/solidbase";

		const code = await transformMdxModule(
			"export default function Page() {}",
			modulePath,
			{ markdown: {} },
		);

		expect(code).toContain('llmText: "# Home');
		expect(code).toContain("Welcome to SolidBase.");
		expect(code).toContain("```md\\n{frontmatter.product}\\n```");
	});

	it("supports nested vite ids and function edit links", async () => {
		const modulePath = routeFixturePath("guide", "getting-started.mdx");
		process.env.PWD = "/home/sarah/GitHub/solidbase";

		const code = await transformMdxModule(
			"export default function Page() {}",
			`${modulePath}?id=${encodeURIComponent(`${modulePath}?import`)}`,
			{
				markdown: {},
				editPath: (file: string) => `https://example.com/edit/${file}`,
			},
		);

		expect(code).toContain("Getting Started");
		expect(code).toContain("https://example.com/edit/");
		expect(code).toContain(
			"/tests/fixtures/src/routes/guide/getting-started.mdx",
		);
	});

	it("works for markdown files without frontmatter", async () => {
		const markdownPath = routeFixturePath("plain.md");
		const code = await transformMdxModule(
			"export default function Page() {}",
			markdownPath,
			{ markdown: {} },
		);

		expect(code).toContain('llmText: "Just plain markdown."');
	});
});
