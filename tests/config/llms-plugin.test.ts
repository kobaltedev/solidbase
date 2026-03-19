import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import solidBaseLlmsPlugin from "../../src/config/vite-plugin/llms.ts";
import { fixtureSiteRoot } from "../helpers/fixtures.ts";

describe("solidBaseLlmsPlugin", () => {
	it("returns no plugin when llms is disabled", () => {
		expect(solidBaseLlmsPlugin({ llms: false } as any)).toEqual([]);
	});

	it("emits llms assets for the configured root", async () => {
		const pluginOption = solidBaseLlmsPlugin({
			title: "SolidBase Docs",
			description: "Documentation for SolidBase",
			llms: true,
			themeConfig: {
				sidebar: {
					"/": [
						{
							title: "Guide",
							items: [
								{ title: "Getting Started", link: "/guide/getting-started" },
							],
						},
					],
				},
			},
			markdown: {},
		} as any);
		const plugin = (
			Array.isArray(pluginOption) ? pluginOption[0] : pluginOption
		) as any;
		expect(plugin).toBeDefined();
		if (!plugin) throw new Error("Expected LLMS plugin to be defined");

		plugin.configResolved?.({ root: fixtureSiteRoot } as any);
		await plugin.buildStart?.call({} as any);

		const llmsRoot = join(
			fixtureSiteRoot,
			"node_modules",
			".solidbase",
			"llms",
		);
		const [llmsIndex, homeDoc, guideDoc] = await Promise.all([
			readFile(join(llmsRoot, "llms.txt"), "utf8"),
			readFile(join(llmsRoot, "index.md"), "utf8"),
			readFile(join(llmsRoot, "guide", "getting-started.md"), "utf8"),
		]);

		expect(llmsIndex).toContain("/index.md");
		expect(llmsIndex).toContain("/guide/getting-started.md");
		expect(homeDoc).toContain("# Home");
		expect(guideDoc).toContain("# Getting Started");
	});
});
