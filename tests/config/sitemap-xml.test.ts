import { describe, expect, it } from "vitest";

import {
	buildSitemapXmlFiles,
	serializeSitemap,
	serializeSitemapIndex,
} from "../../src/config/sitemap-xml.ts";

describe("serializeSitemap", () => {
	it("emits valid sitemap XML with alternate language links", () => {
		const xml = serializeSitemap([
			{
				routePath: "/guide/getting-started",
				url: "https://example.com/guide/getting-started",
				alternates: [
					{
						hreflang: "en-US",
						href: "https://example.com/guide/getting-started",
					},
					{
						hreflang: "fr-FR",
						href: "https://example.com/fr/guide/getting-started",
					},
					{
						hreflang: "x-default",
						href: "https://example.com/guide/getting-started",
					},
				],
			},
		]);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		);
		expect(xml).toContain(
			"<loc>https://example.com/guide/getting-started</loc>",
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="fr-FR" href="https://example.com/fr/guide/getting-started" />',
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/guide/getting-started" />',
		);
	});

	it("escapes XML entities and omits unsupported sitemap tags", () => {
		const xml = serializeSitemap([
			{
				routePath: "/search",
				url: "https://example.com/search?q=solid&lang=en<fr>",
				alternates: [
					{
						hreflang: "en-US",
						href: "https://example.com/search?q=solid&lang=en<fr>",
					},
				],
			},
		]);

		expect(xml).toContain(
			"<loc>https://example.com/search?q=solid&amp;lang=en&lt;fr&gt;</loc>",
		);
		expect(xml).not.toContain("<priority>");
		expect(xml).not.toContain("<changefreq>");
		expect(xml).not.toContain("<lastmod>");
	});
});

describe("serializeSitemapIndex", () => {
	it("emits a sitemap index with absolute sitemap URLs", () => {
		const xml = serializeSitemapIndex([
			"https://example.com/sitemap-1.xml",
			"https://example.com/sitemap-2.xml",
		]);

		expect(xml).toContain(
			'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		);
		expect(xml).toContain("<loc>https://example.com/sitemap-1.xml</loc>");
		expect(xml).toContain("<loc>https://example.com/sitemap-2.xml</loc>");
		expect(xml).not.toContain("<lastmod>");
	});
});

describe("buildSitemapXmlFiles", () => {
	it("keeps small sites on a single sitemap.xml file", () => {
		const files = buildSitemapXmlFiles("https://example.com", [
			{
				routePath: "/",
				url: "https://example.com/",
				alternates: [{ hreflang: "en-US", href: "https://example.com/" }],
			},
			{
				routePath: "/guide",
				url: "https://example.com/guide",
				alternates: [{ hreflang: "en-US", href: "https://example.com/guide" }],
			},
		]);

		expect(files).toHaveLength(1);
		expect(files[0]?.fileName).toBe("sitemap.xml");
		expect(files[0]?.content).toContain("<urlset");
	});

	it("switches to a sitemap index when the URL limit is exceeded", () => {
		const files = buildSitemapXmlFiles(
			"https://example.com/root/",
			[
				{
					routePath: "/one",
					url: "https://example.com/one",
					alternates: [{ hreflang: "en-US", href: "https://example.com/one" }],
				},
				{
					routePath: "/two",
					url: "https://example.com/two",
					alternates: [{ hreflang: "en-US", href: "https://example.com/two" }],
				},
				{
					routePath: "/three",
					url: "https://example.com/three",
					alternates: [
						{ hreflang: "en-US", href: "https://example.com/three" },
					],
				},
			],
			{ maxUrlsPerSitemap: 2 },
		);

		expect(files.map((file) => file.fileName)).toEqual([
			"sitemap.xml",
			"sitemap-1.xml",
			"sitemap-2.xml",
		]);
		expect(files[0]?.content).toContain("<sitemapindex");
		expect(files[0]?.content).toContain(
			"<loc>https://example.com/root/sitemap-1.xml</loc>",
		);
		expect(files[0]?.content).toContain(
			"<loc>https://example.com/root/sitemap-2.xml</loc>",
		);
		expect(files[1]?.content).toContain("<loc>https://example.com/one</loc>");
		expect(files[1]?.content).toContain("<loc>https://example.com/two</loc>");
		expect(files[2]?.content).toContain("<loc>https://example.com/three</loc>");
	});
});
