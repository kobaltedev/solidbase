import { describe, expect, it } from "vitest";

import { buildSitemapEntries } from "../../src/config/sitemap-index.ts";

const config = {
	lang: "en-US",
	locales: {
		root: { label: "English", lang: "en-US" },
		fr: { label: "Francais", lang: "fr-FR" },
	},
} as any;

describe("buildSitemapEntries", () => {
	it("emits absolute canonical URLs and localized alternates", () => {
		const entries = buildSitemapEntries("https://example.com", config, [
			{
				routePath: "/",
				markdownPath: "/index.md",
				filePath: "/tmp/src/routes/index.mdx",
				source: "",
				frontmatter: { title: "Home" },
			},
			{
				routePath: "/guide/getting-started",
				markdownPath: "/guide/getting-started.md",
				filePath: "/tmp/src/routes/guide/getting-started.mdx",
				source: "",
				frontmatter: { title: "Getting Started" },
			},
			{
				routePath: "/fr",
				markdownPath: "/fr.md",
				filePath: "/tmp/src/routes/fr/index.mdx",
				source: "",
				frontmatter: { title: "Accueil" },
			},
			{
				routePath: "/fr/guide/getting-started",
				markdownPath: "/fr/guide/getting-started.md",
				filePath: "/tmp/src/routes/fr/guide/getting-started.mdx",
				source: "",
				frontmatter: { title: "Demarrage" },
			},
		]);

		expect(entries).toEqual([
			{
				routePath: "/",
				url: "https://example.com/",
				alternates: [
					{ hreflang: "en-US", href: "https://example.com/" },
					{ hreflang: "fr-FR", href: "https://example.com/fr" },
				],
			},
			{
				routePath: "/fr",
				url: "https://example.com/fr",
				alternates: [
					{ hreflang: "en-US", href: "https://example.com/" },
					{ hreflang: "fr-FR", href: "https://example.com/fr" },
				],
			},
			{
				routePath: "/fr/guide/getting-started",
				url: "https://example.com/fr/guide/getting-started",
				alternates: [
					{
						hreflang: "en-US",
						href: "https://example.com/guide/getting-started",
					},
					{
						hreflang: "fr-FR",
						href: "https://example.com/fr/guide/getting-started",
					},
				],
			},
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
				],
			},
		]);
	});

	it("does not invent alternate links for routes without localized matches", () => {
		const entries = buildSitemapEntries("https://example.com/", config, [
			{
				routePath: "/guide/deploy",
				markdownPath: "/guide/deploy.md",
				filePath: "/tmp/src/routes/guide/deploy.mdx",
				source: "",
				frontmatter: { title: "Deploy" },
			},
		]);

		expect(entries).toEqual([
			{
				routePath: "/guide/deploy",
				url: "https://example.com/guide/deploy",
				alternates: [
					{
						hreflang: "en-US",
						href: "https://example.com/guide/deploy",
					},
				],
			},
		]);
	});

	it("excludes routes that opt out of sitemap indexing", () => {
		const entries = buildSitemapEntries("https://example.com", config, [
			{
				routePath: "/guide/internal",
				markdownPath: "/guide/internal.md",
				filePath: "/tmp/src/routes/guide/internal.mdx",
				source: "",
				frontmatter: { title: "Internal", sitemap: false },
			},
			{
				routePath: "/guide/preview",
				markdownPath: "/guide/preview.md",
				filePath: "/tmp/src/routes/guide/preview.mdx",
				source: "",
				frontmatter: { title: "Preview", sitemap: { exclude: true } },
			},
			{
				routePath: "/guide/public",
				markdownPath: "/guide/public.md",
				filePath: "/tmp/src/routes/guide/public.mdx",
				source: "",
				frontmatter: { title: "Public" },
			},
		]);

		expect(entries).toEqual([
			{
				routePath: "/guide/public",
				url: "https://example.com/guide/public",
				alternates: [
					{
						hreflang: "en-US",
						href: "https://example.com/guide/public",
					},
				],
			},
		]);
	});
});
