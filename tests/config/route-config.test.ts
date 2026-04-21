import { describe, expect, it } from "vitest";

import {
	buildSolidBaseRoutePath,
	getSolidBaseRouteSelectionForPath,
	getSolidBaseRouteOptions,
	isSolidBaseRouteIncluded,
	resolveSolidBaseRouteConfig,
	type SolidBaseRoutesConfig,
} from "../../src/config/route-config.ts";

const routes = {
	path: "/{project}/{version}/{locale}",
	project: {
		default: "solid",
		values: {
			solid: { path: "", label: "Solid" },
			router: { path: "router", label: "Solid Router" },
			start: { path: "start", label: "SolidStart" },
		},
	},
	version: {
		default: "latest",
		values: {
			latest: { path: "", label: "Latest" },
			v1: { path: "v1", label: "v1", status: "Legacy" },
			v0: { href: "https://v0.solidjs.com", label: "v0" },
		},
	},
	locale: {
		default: "en",
		values: {
			en: { path: "", label: "English", lang: "en-US" },
			fr: { path: "fr", label: "Français", lang: "fr-FR" },
			es: { path: "es", label: "Español", lang: "es-ES" },
		},
	},
	include: [
		{
			project: ["solid", "router", "start"],
			version: "latest",
			locale: ["en", "fr"],
		},
		{ project: "solid", version: ["latest", "v1"], locale: ["en", "fr", "es"] },
	],
} satisfies SolidBaseRoutesConfig;

describe("route config helpers", () => {
	it("builds paths from default and selected route values", () => {
		expect(buildSolidBaseRoutePath(routes)).toBe("/");
		expect(buildSolidBaseRoutePath(routes, { locale: "fr" })).toBe("/fr");
		expect(buildSolidBaseRoutePath(routes, { version: "v1" })).toBe("/v1");
		expect(
			buildSolidBaseRoutePath(routes, {
				project: "router",
				locale: "fr",
			}),
		).toBe("/router/fr");
		expect(getSolidBaseRouteSelectionForPath(routes, "/router/fr")).toEqual({
			project: "router",
			version: "latest",
			locale: "fr",
		});
	});

	it("filters internal route combinations through include rules", () => {
		expect(
			isSolidBaseRouteIncluded(routes, {
				project: "router",
				version: "latest",
				locale: "fr",
			}),
		).toBe(true);
		expect(
			isSolidBaseRouteIncluded(routes, {
				project: "router",
				version: "latest",
				locale: "es",
			}),
		).toBe(false);
		expect(
			isSolidBaseRouteIncluded(routes, {
				project: "router",
				version: "v1",
				locale: "en",
			}),
		).toBe(false);
		expect(
			isSolidBaseRouteIncluded(routes, {
				project: "solid",
				version: "v1",
				locale: "es",
			}),
		).toBe(true);
	});

	it("returns valid route options plus external links", () => {
		expect(
			getSolidBaseRouteOptions(routes, "locale", {
				project: "router",
				version: "latest",
				locale: "fr",
			}).map((option) => option.name),
		).toEqual(["en", "fr"]);

		expect(
			getSolidBaseRouteOptions(routes, "locale", {
				project: "solid",
				version: "v1",
				locale: "fr",
			}).map((option) => option.name),
		).toEqual(["en", "fr", "es"]);

		expect(
			getSolidBaseRouteOptions(routes, "version", {
				project: "router",
				version: "latest",
				locale: "fr",
			}),
		).toMatchObject([
			{
				name: "latest",
				path: "/router/fr",
				isExternal: false,
			},
			{
				name: "v0",
				href: "https://v0.solidjs.com",
				isExternal: true,
			},
		]);
	});

	it("treats omitted include as all internal combinations", () => {
		const openRoutes = {
			...routes,
			include: undefined,
		} satisfies SolidBaseRoutesConfig;

		expect(
			buildSolidBaseRoutePath(openRoutes, {
				project: "router",
				version: "v1",
				locale: "es",
			}),
		).toBe("/router/v1/es");
	});

	it("applies matching overrides in order with a shallow theme config merge", () => {
		const config = resolveSolidBaseRouteConfig(
			{
				title: "Docs",
				routes,
				themeConfig: {
					nav: ["base"],
					sidebar: { "/": [] },
					socialLinks: { github: "base" },
				},
				overrides: [
					{
						project: "solid",
						title: "Solid",
						themeConfig: { nav: ["solid"] },
					},
					{
						locale: "fr",
						title: "Docs FR",
						themeConfig: { sidebar: { "/fr": [] } },
					},
					{
						project: "solid",
						version: "v1",
						locale: "fr",
						title: "Solid v1 FR",
					},
				],
			},
			{ project: "solid", version: "v1", locale: "fr" },
		);

		expect(config).toMatchObject({
			title: "Solid v1 FR",
			themeConfig: {
				nav: ["solid"],
				sidebar: { "/fr": [] },
				socialLinks: { github: "base" },
			},
		});
		expect("overrides" in config).toBe(false);
	});
});
