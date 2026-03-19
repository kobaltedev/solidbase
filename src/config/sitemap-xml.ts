import type { SitemapEntry } from "./sitemap-index.js";

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const DEFAULT_MAX_URLS_PER_SITEMAP = 50_000;

export type SitemapXmlFile = {
	fileName: string;
	content: string;
};

type BuildSitemapXmlFilesOptions = {
	maxUrlsPerSitemap?: number;
};

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function chunkEntries(entries: SitemapEntry[], maxUrlsPerSitemap: number) {
	const chunks: SitemapEntry[][] = [];

	for (let index = 0; index < entries.length; index += maxUrlsPerSitemap) {
		chunks.push(entries.slice(index, index + maxUrlsPerSitemap));
	}

	return chunks;
}

export function serializeSitemap(entries: SitemapEntry[]) {
	const hasAlternates = entries.some((entry) => entry.alternates.length > 1);
	const namespace = hasAlternates
		? `xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}"`
		: `xmlns="${SITEMAP_NAMESPACE}"`;

	const body = entries
		.map((entry) => {
			const alternates = entry.alternates
				.map(
					(alternate) =>
						`    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`,
				)
				.join("\n");

			return [
				"  <url>",
				`    <loc>${escapeXml(entry.url)}</loc>`,
				alternates,
				"  </url>",
			]
				.filter(Boolean)
				.join("\n");
		})
		.join("\n");

	return [XML_DECLARATION, `<urlset ${namespace}>`, body, "</urlset>"]
		.filter(Boolean)
		.join("\n");
}

export function serializeSitemapIndex(urls: string[]) {
	const body = urls
		.map((url) =>
			[`  <sitemap>`, `    <loc>${escapeXml(url)}</loc>`, "  </sitemap>"].join(
				"\n",
			),
		)
		.join("\n");

	return [
		XML_DECLARATION,
		`<sitemapindex xmlns="${SITEMAP_NAMESPACE}">`,
		body,
		"</sitemapindex>",
	]
		.filter(Boolean)
		.join("\n");
}

export function buildSitemapXmlFiles(
	hostname: string,
	entries: SitemapEntry[],
	options: BuildSitemapXmlFilesOptions = {},
): SitemapXmlFile[] {
	const maxUrlsPerSitemap =
		options.maxUrlsPerSitemap ?? DEFAULT_MAX_URLS_PER_SITEMAP;

	if (entries.length <= maxUrlsPerSitemap) {
		return [{ fileName: "sitemap.xml", content: serializeSitemap(entries) }];
	}

	const chunks = chunkEntries(entries, maxUrlsPerSitemap);
	const sitemapFiles = chunks.map((chunk, index) => ({
		fileName: `sitemap-${index + 1}.xml`,
		content: serializeSitemap(chunk),
	}));
	const sitemapIndex = serializeSitemapIndex(
		sitemapFiles.map(({ fileName }) => new URL(fileName, hostname).toString()),
	);

	return [{ fileName: "sitemap.xml", content: sitemapIndex }, ...sitemapFiles];
}
