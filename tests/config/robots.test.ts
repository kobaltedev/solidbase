import { describe, expect, it } from "vitest";

import { buildRobotsTxt } from "../../src/config/robots.ts";

describe("buildRobotsTxt", () => {
	it("emits a Google-aligned allow-all robots file with sitemap by default", () => {
		const robots = buildRobotsTxt({
			lang: "en-US",
			sitemap: { hostname: "https://solidbase.dev" },
			robots: true,
		} as any);

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

	it("omits the sitemap line when robots disables it", () => {
		const robots = buildRobotsTxt({
			lang: "en-US",
			sitemap: { hostname: "https://solidbase.dev" },
			robots: { sitemap: false },
		} as any);

		expect(robots).toBe(["User-agent: *", "Allow: /", ""].join("\n"));
	});

	it("preserves custom user-agent groups and rule ordering", () => {
		const robots = buildRobotsTxt({
			lang: "en-US",
			robots: {
				rules: [
					{
						userAgent: ["Googlebot", "Googlebot-Image"],
						allow: ["/"],
						disallow: ["/preview/", "/*.gif$"],
					},
					{
						userAgent: "*",
						disallow: ["/admin/"],
					},
				],
				sitemap: "https://solidbase.dev/sitemap.xml",
			},
		} as any);

		expect(robots).toBe(
			[
				"User-agent: Googlebot",
				"User-agent: Googlebot-Image",
				"Allow: /",
				"Disallow: /preview/",
				"Disallow: /*.gif$",
				"",
				"User-agent: *",
				"Disallow: /admin/",
				"",
				"Sitemap: https://solidbase.dev/sitemap.xml",
				"",
			].join("\n"),
		);
	});

	it("returns an empty string when robots is disabled", () => {
		expect(buildRobotsTxt({ robots: false } as any)).toBe("");
	});
});
