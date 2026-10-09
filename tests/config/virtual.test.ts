import { afterEach, describe, expect, it } from "vitest";

import { transformMdxModule } from "../../src/config/vite-plugin/virtual.ts";
import { fixtureSiteRoot, routeFixturePath } from "../helpers/fixtures.ts";

describe("transformMdxModule", () => {
	const previousPwd = process.env.PWD;

	afterEach(() => {
		process.env.PWD = previousPwd;
	});

	it("supports nested vite ids and function edit links", async () => {
		const modulePath = routeFixturePath("guide", "getting-started.mdx");

		const code = await transformMdxModule(
			"export default function Page() {}",
			`${modulePath}?id=${encodeURIComponent(`${modulePath}?import`)}`,
			{
				markdown: {},
				editPath: (file: string) => `https://example.com/edit/${file}`,
			},
			fixtureSiteRoot,
		);

		expect(code).toContain("https://example.com/edit/");
		expect(code).toContain(
			"/tests/fixtures/src/routes/guide/getting-started.mdx",
		);
		// keyed like the route's moduleUrl: relative to the Vite root
		expect(code).toContain(
			'window.$$SolidBase_page_data["src/routes/guide/getting-started.mdx"]',
		);
		expect(code).not.toContain("llmText:");
	});

	it("works for markdown files without frontmatter", async () => {
		const markdownPath = routeFixturePath("plain.md");
		const code = await transformMdxModule(
			"export default function Page() {}",
			markdownPath,
			{ markdown: {} },
			fixtureSiteRoot,
		);

		expect(code).toContain("frontmatter:");
		expect(code).not.toContain("llmText:");
	});
});
