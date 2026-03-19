import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import solidBaseRobotsPlugin from "../../src/config/vite-plugin/robots.ts";
import { fixtureSiteRoot } from "../helpers/fixtures.ts";

describe("solidBaseRobotsPlugin", () => {
	it("returns no plugin when robots is disabled", () => {
		expect(solidBaseRobotsPlugin({ robots: false } as any)).toEqual([]);
	});

	it("writes robots.txt with the canonical sitemap URL", async () => {
		const pluginOption = solidBaseRobotsPlugin({
			lang: "en-US",
			siteUrl: "https://solidbase.dev",
			sitemap: true,
			robots: true,
		} as any);
		const plugin = (
			Array.isArray(pluginOption) ? pluginOption[0] : pluginOption
		) as any;

		expect(plugin).toBeDefined();
		if (!plugin) throw new Error("Expected robots plugin to be defined");

		plugin.configResolved?.({ root: fixtureSiteRoot } as any);
		await plugin.buildStart?.call({} as any);

		const robots = await readFile(
			join(
				fixtureSiteRoot,
				"node_modules",
				".solidbase",
				"robots",
				"robots.txt",
			),
			"utf8",
		);

		expect(robots).toBe(
			[
				"User-agent: *",
				"Allow: /",
				"",
				"Sitemap: https://solidbase.dev/sitemap.xml",
				"",
			].join("\n"),
		);
	});

	it("writes custom robots groups in order", async () => {
		const pluginOption = solidBaseRobotsPlugin({
			lang: "en-US",
			robots: {
				rules: [
					{ userAgent: "Googlebot", allow: ["/"], disallow: ["/preview/"] },
					{ userAgent: "*", disallow: ["/admin/"] },
				],
				sitemap: false,
			},
		} as any);
		const plugin = (
			Array.isArray(pluginOption) ? pluginOption[0] : pluginOption
		) as any;

		plugin.configResolved?.({ root: fixtureSiteRoot } as any);
		await plugin.buildStart?.call({} as any);

		const robots = await readFile(
			join(
				fixtureSiteRoot,
				"node_modules",
				".solidbase",
				"robots",
				"robots.txt",
			),
			"utf8",
		);

		expect(robots).toBe(
			[
				"User-agent: Googlebot",
				"Allow: /",
				"Disallow: /preview/",
				"",
				"User-agent: *",
				"Disallow: /admin/",
				"",
			].join("\n"),
		);
	});
});
