import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const NpmIcon = () => null;
const pathname = vi.fn<() => string>(() => "/");

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

vi.mock("../../src/client/locale.ts", () => ({
	useLocale: () => ({
		currentLocale: () => ({
			config: {
				themeConfig: {
					nav: { title: "Localized" },
				},
			},
		}),
	}),
}));

describe("route config helper", () => {
	afterEach(() => {
		pathname.mockReset();
		pathname.mockReturnValue("/");
		setSolidBaseConfig({});
		vi.resetModules();
	});

	it("merges locale theme config over the base config", async () => {
		setSolidBaseConfig({
			title: "Docs",
			themeConfig: {
				actions: {
					icons: {
						npm: NpmIcon,
						gh: "<svg />",
					},
				},
				nav: { title: "Default" },
				sidebar: { "/": [] },
			},
		});

		const { useRouteSolidBaseConfig } = await import(
			"../../src/client/config.ts"
		);
		const { SolidBaseRoutesContextProvider } = await import(
			"../../src/client/routes.ts"
		);

		createRoot((dispose) => {
			let config: ReturnType<typeof useRouteSolidBaseConfig<any>> | undefined;

			SolidBaseRoutesContextProvider({
				get children() {
					config = useRouteSolidBaseConfig<any>();
					return null;
				},
			} as any);

			expect(config?.()).toMatchObject({
				title: "Docs",
				themeConfig: {
					actions: {
						icons: {
							npm: NpmIcon,
							gh: "<svg />",
						},
					},
					nav: { title: "Localized" },
					sidebar: { "/": [] },
				},
			});
			dispose();
		});
	});

	it("merges route overrides before locale theme config", async () => {
		pathname.mockReturnValue("/v1/fr");
		setSolidBaseConfig({
			title: "Docs",
			routes: {
				path: "/{version}/{locale}",
				version: {
					default: "latest",
					values: {
						latest: { path: "", label: "Latest" },
						v1: { path: "v1", label: "v1" },
					},
				},
				locale: {
					default: "en",
					values: {
						en: { path: "", label: "English" },
						fr: { path: "fr", label: "Français" },
					},
				},
			},
			themeConfig: {
				nav: { title: "Default" },
				sidebar: { "/": [] },
			},
			overrides: [
				{
					version: "v1",
					title: "Docs v1",
					themeConfig: {
						sidebar: { "/v1": [] },
					},
				},
			],
		});

		const { useRouteSolidBaseConfig } = await import(
			"../../src/client/config.ts"
		);
		const { SolidBaseRoutesContextProvider } = await import(
			"../../src/client/routes.ts"
		);

		createRoot((dispose) => {
			let config: ReturnType<typeof useRouteSolidBaseConfig<any>> | undefined;

			SolidBaseRoutesContextProvider({
				get children() {
					config = useRouteSolidBaseConfig<any>();
					return null;
				},
			} as any);

			expect(config?.()).toMatchObject({
				title: "Docs v1",
				themeConfig: {
					nav: { title: "Localized" },
					sidebar: { "/v1": [] },
				},
			});
			dispose();
		});
	});
});
