import { describe, expect, it } from "vitest";

import {
	resolveCanonicalUrl,
	resolveDocumentMetadata,
	resolveHeadMetadata,
} from "../../src/client/document-metadata.ts";

describe("SolidBase document metadata", () => {
	it("resolves a normal route from page and site metadata", () => {
		expect(
			resolveDocumentMetadata(
				{
					description: "SolidBase documentation",
					siteUrl: "https://solidbase.dev",
					title: "SolidBase",
				},
				{ title: "Getting Started" },
			),
		).toEqual({
			description: "SolidBase documentation",
			title: "Getting Started - SolidBase",
		});
		expect(
			resolveCanonicalUrl("https://solidbase.dev", {
				pathname: "/guide/getting-started",
			}),
		).toBe("https://solidbase.dev/guide/getting-started");
	});

	it("uses only pathname and normalizes URL slashes", () => {
		const location = {
			hash: "#installation",
			pathname: "/fr/guide/getting-started/",
			search: "?tab=api",
		};

		expect(resolveCanonicalUrl("https://solidbase.dev///", location)).toBe(
			"https://solidbase.dev/fr/guide/getting-started/",
		);
	});

	it("uses frontmatter title, template, and description overrides", () => {
		expect(
			resolveDocumentMetadata(
				{
					description: "Config description",
					title: "SolidBase",
					titleTemplate: ":title | Docs",
				},
				{
					description: "Page description",
					title: "Installation",
					titleTemplate: ":title | Custom",
				},
			),
		).toEqual({
			description: "Page description",
			title: "Installation | Custom",
		});
	});

	it("returns no description when none resolves", () => {
		expect(resolveDocumentMetadata({ title: "SolidBase" })).toEqual({
			description: undefined,
			title: "SolidBase - SolidBase",
		});
	});

	it("returns no canonical URL without siteUrl", () => {
		expect(
			resolveCanonicalUrl(undefined, { pathname: "/reference" }),
		).toBeUndefined();
	});

	it("waits for page data before resolving the head metadata set", () => {
		const config = {
			description: "SolidBase documentation",
			siteUrl: "https://solidbase.dev",
			title: "SolidBase",
		};
		const location = { pathname: "/guide/getting-started" };

		expect(resolveHeadMetadata(config, undefined, location)).toBeUndefined();
		expect(
			resolveHeadMetadata(
				config,
				{ frontmatter: { title: "Getting Started" } },
				location,
			),
		).toEqual({
			canonicalUrl: "https://solidbase.dev/guide/getting-started",
			description: "SolidBase documentation",
			title: "Getting Started - SolidBase",
		});
	});
});
