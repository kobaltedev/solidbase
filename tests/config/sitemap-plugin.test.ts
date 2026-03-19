import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import solidBaseSitemapPlugin from "../../src/config/vite-plugin/sitemap.ts";
import { fixtureSiteRoot } from "../helpers/fixtures.ts";

describe("solidBaseSitemapPlugin", () => {
	it("returns no plugin when sitemap is disabled", () => {
		expect(solidBaseSitemapPlugin({ sitemap: false } as any)).toEqual([]);
	});

	it("writes sitemap.xml for the configured root", async () => {
		const pluginOption = solidBaseSitemapPlugin({
			lang: "en-US",
			siteUrl: "https://example.com",
			locales: {
				root: { label: "English", lang: "en-US" },
			},
			sitemap: true,
		} as any);
		const plugin = (
			Array.isArray(pluginOption) ? pluginOption[0] : pluginOption
		) as any;

		expect(plugin).toBeDefined();
		if (!plugin) throw new Error("Expected sitemap plugin to be defined");

		plugin.configResolved?.({ root: fixtureSiteRoot } as any);
		await plugin.buildStart?.call({} as any);

		const sitemap = await readFile(
			join(
				fixtureSiteRoot,
				"node_modules",
				".solidbase",
				"sitemap",
				"sitemap.xml",
			),
			"utf8",
		);

		expect(sitemap).toContain("<urlset");
		expect(sitemap).toContain("<loc>https://example.com/</loc>");
		expect(sitemap).toContain(
			"<loc>https://example.com/guide/getting-started</loc>",
		);
	});

	it("writes a sitemap index when the URL limit is exceeded", async () => {
		const pluginOption = solidBaseSitemapPlugin({
			lang: "en-US",
			siteUrl: "https://example.com",
			locales: {
				root: { label: "English", lang: "en-US" },
			},
			sitemap: {
				maxUrlsPerSitemap: 1,
			},
		} as any);
		const plugin = (
			Array.isArray(pluginOption) ? pluginOption[0] : pluginOption
		) as any;

		expect(plugin).toBeDefined();
		if (!plugin) throw new Error("Expected sitemap plugin to be defined");

		plugin.configResolved?.({ root: fixtureSiteRoot } as any);
		await plugin.buildStart?.call({} as any);

		const sitemapRoot = join(
			fixtureSiteRoot,
			"node_modules",
			".solidbase",
			"sitemap",
		);
		const [indexXml, sitemapOne, sitemapTwo] = await Promise.all([
			readFile(join(sitemapRoot, "sitemap.xml"), "utf8"),
			readFile(join(sitemapRoot, "sitemap-1.xml"), "utf8"),
			readFile(join(sitemapRoot, "sitemap-2.xml"), "utf8"),
		]);

		expect(indexXml).toContain("<sitemapindex");
		expect(indexXml).toContain("<loc>https://example.com/sitemap-1.xml</loc>");
		expect(indexXml).toContain("<loc>https://example.com/sitemap-2.xml</loc>");
		expect(sitemapOne).toContain("<urlset");
		expect(sitemapTwo).toContain("<urlset");
	});
});
