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
});
