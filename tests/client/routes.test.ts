import { createRoot, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn<() => string>(() => "/router/fr");

function setSolidBaseConfig(value: Record<string, unknown>) {
	const store = ((globalThis as any).__solidBaseConfig ??= {}) as Record<
		string,
		unknown
	>;
	for (const key of Object.keys(store)) delete store[key];
	Object.assign(store, value);
}

vi.mock("@solidjs/router", () => ({
	useLocation: () => ({
		get pathname() {
			return pathname();
		},
	}),
}));

const routes = {
	path: "/{project}/{version}/{locale}",
	project: {
		default: "solid",
		values: {
			solid: { path: "", label: "Solid" },
			router: { path: "router", label: "Solid Router" },
		},
	},
	version: {
		default: "latest",
		values: {
			latest: { path: "", label: "Latest" },
			v1: { path: "v1", label: "v1" },
			v0: { href: "https://v0.solidjs.com", label: "v0" },
		},
	},
	locale: {
		default: "en",
		values: {
			en: { path: "", label: "English" },
			fr: { path: "fr", label: "Français" },
			es: { path: "es", label: "Español" },
		},
	},
	include: [
		{ project: ["solid", "router"], version: "latest", locale: ["en", "fr"] },
		{ project: "solid", version: "latest", locale: "es" },
		{ project: "solid", version: "v1", locale: ["en", "fr", "es"] },
	],
};

describe("solidbase route client helpers", () => {
	afterEach(() => {
		pathname.mockReset();
		pathname.mockReturnValue("/router/fr");
		setSolidBaseConfig({});
		vi.resetModules();
	});

	it("resolves the current route selection from the current pathname", async () => {
		setSolidBaseConfig({ routes });

		const { SolidBaseRoutesContextProvider, useSolidBaseRoute } = await import(
			"../../src/client/routes.ts"
		);

		createRoot((dispose) => {
			let current: ReturnType<typeof useSolidBaseRoute> | undefined;

			SolidBaseRoutesContextProvider({
				get children() {
					current = useSolidBaseRoute();
					return null;
				},
			} as any);

			expect(current?.()).toEqual({
				project: "router",
				version: "latest",
				locale: "fr",
			});
			dispose();
		});
	});

	it("returns filtered options and external route links", async () => {
		setSolidBaseConfig({ routes });

		const { SolidBaseRoutesContextProvider, useSolidBaseRoutes } = await import(
			"../../src/client/routes.ts"
		);

		createRoot((dispose) => {
			let helpers: ReturnType<typeof useSolidBaseRoutes> | undefined;

			SolidBaseRoutesContextProvider({
				get children() {
					helpers = useSolidBaseRoutes();
					return null;
				},
			} as any);

			expect(helpers?.options("locale").map((option) => option.name)).toEqual([
				"en",
				"fr",
			]);
			expect(helpers?.options("version")).toMatchObject([
				{ name: "latest", path: "/router/fr", isExternal: false },
				{ name: "v0", href: "https://v0.solidjs.com", isExternal: true },
			]);
			expect(helpers?.path({ project: "solid", version: "v1" })).toBe(
				"/v1/fr",
			);
			dispose();
		});
	});

	it("returns locale options for the current route selection", async () => {
		setSolidBaseConfig({ routes });

		const { SolidBaseRoutesContextProvider, useSolidBaseRoutes } = await import(
			"../../src/client/routes.ts"
		);

		createRoot((dispose) => {
			const [currentPathname, setCurrentPathname] = createSignal("/");
			pathname.mockImplementation(currentPathname);
			let helpers: ReturnType<typeof useSolidBaseRoutes> | undefined;

			SolidBaseRoutesContextProvider({
				get children() {
					helpers = useSolidBaseRoutes();
					return null;
				},
			} as any);

			expect(helpers?.current()).toEqual({
				project: "solid",
				version: "latest",
				locale: "en",
			});
			expect(helpers?.options("locale").map((option) => option.name)).toEqual([
				"en",
				"fr",
				"es",
			]);

			setCurrentPathname("/router");
			expect(helpers?.current()).toEqual({
				project: "router",
				version: "latest",
				locale: "en",
			});
			expect(helpers?.options("locale").map((option) => option.name)).toEqual([
				"en",
				"fr",
			]);
			dispose();
		});
	});
});
