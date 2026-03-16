import { describe, expect, it, vi } from "vitest";

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
		const emitFile = vi.fn();

		await plugin.generateBundle?.call({ emitFile } as any);

		expect(emitFile).toHaveBeenCalledWith(
			expect.objectContaining({ fileName: "llms.txt", type: "asset" }),
		);
		expect(emitFile).toHaveBeenCalledWith(
			expect.objectContaining({ fileName: "index.md", type: "asset" }),
		);
		expect(emitFile).toHaveBeenCalledWith(
			expect.objectContaining({
				fileName: "guide/getting-started.md",
				type: "asset",
			}),
		);
	});
});
