// @vitest-environment jsdom

import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn<() => string>(() => "/fr/guide/install");
const navigate = vi.fn<(to: string) => Promise<void>>(() => Promise.resolve());
const matchRest = vi.fn<() => string | undefined>(() => "guide/install");

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
	useNavigate: () => navigate,
	useMatch: () => () => ({ params: { rest: matchRest() } }),
}));

vi.mock("solid-js", async () => {
	const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
	return {
		...actual,
		startTransition: (fn: () => void) => Promise.resolve(fn()),
	};
});

vi.mock("solid-js/web", () => ({
	getRequestEvent: vi.fn(),
	isServer: false,
}));

describe("locale client helpers", () => {
	afterEach(() => {
		pathname.mockReset();
		pathname.mockReturnValue("/fr/guide/install");
		navigate.mockReset();
		navigate.mockReturnValue(Promise.resolve());
		matchRest.mockReset();
		matchRest.mockReturnValue("guide/install");
		setSolidBaseConfig({});
		vi.resetModules();
	});

	it("selects the current locale, prefixes paths, and navigates when switching", async () => {
		document.documentElement.lang = "";
		setSolidBaseConfig({
			lang: "en-US",
			locales: {
				root: { label: "English" },
				fr: { label: "Francais" },
			},
		});

		const { LocaleContextProvider, getLocaleLink, useLocale } = await import(
			"../../src/client/locale.ts"
		);

		createRoot((dispose) => {
			let value: ReturnType<typeof useLocale> | undefined;

			LocaleContextProvider({
				get children() {
					value = useLocale();
					return null;
				},
			} as any);

			expect(value?.currentLocale().code).toBe("fr");
			expect(value?.routePath()).toBe("/guide/install");
			expect(value?.applyPathPrefix("reference")).toBe("/fr/reference");
			expect(getLocaleLink(value!.locales[0]!)).toBe("/");
			expect(getLocaleLink(value!.locales[1]!)).toBe("/fr/");

			void value?.setLocale(value!.locales[0]!);
			dispose();
		});

		await Promise.resolve();
		expect(navigate).toHaveBeenCalledWith("/guide/install");
		expect(document.documentElement.lang).toBe("en-US");
	});

	it("supports custom locale links and root fallback resolution", async () => {
		setSolidBaseConfig({
			lang: "en-US",
			locales: {
				root: { label: "English", link: "/docs/" },
				de: { label: "Deutsch", link: "/de/docs/" },
			},
		});

		const { getLocale, getLocaleLink } = await import(
			"../../src/client/locale.ts"
		);

		expect(getLocale("/de/docs/setup").code).toBe("de");
		expect(getLocale("/docs/setup").code).toBe("en-US");
		expect(getLocaleLink(getLocale("/de/docs/setup"))).toBe("/de/docs/");
	});
});
