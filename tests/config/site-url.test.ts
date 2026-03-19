import { describe, expect, it } from "vitest";

import { getSitemapHostname, getSiteUrl } from "../../src/config/index.ts";

describe("getSiteUrl", () => {
	it("normalizes the canonical site URL with a trailing slash", () => {
		expect(getSiteUrl({ siteUrl: "https://solidbase.dev" })).toBe(
			"https://solidbase.dev/",
		);
		expect(getSiteUrl({ siteUrl: "https://solidbase.dev/" })).toBe(
			"https://solidbase.dev/",
		);
	});

	it("returns undefined when no site URL is configured", () => {
		expect(getSiteUrl({})).toBeUndefined();
	});
});

describe("getSitemapHostname", () => {
	it("uses the explicit sitemap hostname when present", () => {
		expect(
			getSitemapHostname({
				siteUrl: "https://solidbase.dev",
				sitemap: { hostname: "https://docs.solidbase.dev" },
			}),
		).toBe("https://docs.solidbase.dev/");
	});

	it("falls back to the shared site URL when sitemap is enabled", () => {
		expect(
			getSitemapHostname({
				siteUrl: "https://solidbase.dev",
				sitemap: true,
			}),
		).toBe("https://solidbase.dev/");
	});

	it("returns undefined when sitemap has no resolvable hostname", () => {
		expect(getSitemapHostname({ sitemap: true })).toBeUndefined();
		expect(
			getSitemapHostname({ siteUrl: "https://solidbase.dev" }),
		).toBeUndefined();
	});
});
