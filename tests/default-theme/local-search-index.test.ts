import { describe, expect, it } from "vitest";
import { getLocalSearchScopeForPath } from "../../src/default-theme/search.ts";
import {
	buildLocalSearchRecords,
	splitSearchSections,
} from "../../src/default-theme/search-index.ts";
import { fixtureSiteRoot } from "../helpers/fixtures.ts";

describe("splitSearchSections", () => {
	it("creates searchable heading sections with stable duplicate anchors", () => {
		const sections = splitSearchSections(
			[
				"# Guide",
				"",
				"Welcome to SolidBase.",
				"",
				"## Install",
				"",
				"First install section.",
				"",
				"## Install",
				"",
				"Second install section.",
			].join("\n"),
			{ routePath: "/guide", title: "Guide", description: "Start here" },
		);

		expect(sections).toEqual([
			expect.objectContaining({
				url: "/guide#guide",
				title: "Guide",
				content: "Start here Welcome to SolidBase.",
			}),
			expect.objectContaining({
				url: "/guide#install",
				title: "Install",
				titles: ["Guide"],
			}),
			expect.objectContaining({
				url: "/guide#install-1",
				content: "Second install section.",
			}),
		]);
	});
});

describe("getLocalSearchScopeForPath", () => {
	it("creates stable keys for route axes", () => {
		expect(
			getLocalSearchScopeForPath("/v1/fr", {
				routes: {
					path: "/{project}/{version}/{locale}",
					project: {
						default: "solid",
						values: { solid: { path: "" } },
					},
					version: {
						default: "latest",
						values: { latest: { path: "" }, v1: { path: "v1" } },
					},
					locale: {
						default: "en",
						values: { en: { path: "" }, fr: { path: "fr" } },
					},
				},
			}),
		).toBe("locale:fr|project:solid|version:v1");
	});

	it("matches legacy locale landing paths with trailing-slash links", () => {
		const config = {
			locales: {
				root: { label: "English" },
				fr: { label: "Français", link: "/fr/" },
			},
		};

		expect(getLocalSearchScopeForPath("/fr", config)).toBe("fr");
		expect(getLocalSearchScopeForPath("/fr/guide", config)).toBe("fr");
		expect(getLocalSearchScopeForPath("/guide", config)).toBe("root");
	});
});

describe("buildLocalSearchRecords", () => {
	it("builds Pagefind records with language, metadata, and scope filters", async () => {
		const records = await buildLocalSearchRecords(
			fixtureSiteRoot,
			{
				themeConfig: { search: { local: true } },
				markdown: {},
				lang: "en-US",
			} as any,
			async () => null,
		);

		expect(records).toContainEqual({
			url: "/guide/getting-started#getting-started",
			content: "Learn the basics Start with SolidBase.",
			language: "en",
			meta: { title: "Getting Started" },
			filters: { scope: ["root"] },
		});
	});

	it("omits pages with search disabled", async () => {
		const records = await buildLocalSearchRecords(
			fixtureSiteRoot,
			{
				themeConfig: { search: { local: true } },
				markdown: {},
				lang: "en-US",
			} as any,
			async () => null,
		);

		expect(records.some((record) => record.meta?.title === "Hidden Doc")).toBe(
			false,
		);
	});

	it("tags records with the current route-axis selection", async () => {
		const records = await buildLocalSearchRecords(
			fixtureSiteRoot,
			{
				themeConfig: { search: { local: true } },
				markdown: {},
				lang: "en-US",
				routes: {
					path: "/{project}",
					project: {
						default: "docs",
						values: {
							docs: { path: "" },
							guide: { path: "guide" },
						},
					},
				},
			} as any,
			async () => null,
		);

		expect(records.find((record) => record.url === "/#home")?.filters).toEqual({
			scope: ["project:docs"],
		});
		expect(
			records.find(
				(record) => record.url === "/guide/getting-started#getting-started",
			)?.filters,
		).toEqual({ scope: ["project:guide"] });
	});
});
