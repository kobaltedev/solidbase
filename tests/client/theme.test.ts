// @vitest-environment jsdom

import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const prefersDarkValue = vi.fn<() => boolean>(() => false);
const useHead = vi.fn();

vi.mock("@solid-primitives/media", () => ({
	usePrefersDark: () => prefersDarkValue,
}));

vi.mock("solid-js", async () => {
	const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
	return {
		...actual,
		createEffect: (fn: () => void) => fn(),
		createUniqueId: () => "theme-script",
	};
});

vi.mock("@solidjs/meta", () => ({
	useHead,
}));

vi.mock("solid-js/web", () => ({
	getRequestEvent: vi.fn(),
	isServer: false,
}));

vi.mock("../../src/client/read-theme-cookie.js?raw", () => ({
	default: "window.__theme = document.cookie",
}));

describe("theme client helpers", () => {
	afterEach(async () => {
		prefersDarkValue.mockReset();
		prefersDarkValue.mockReturnValue(false);
		useHead.mockReset();
		vi.resetModules();
		document.cookie = "";
	});

	it("derives raw theme, variant, and theme from cookies and system preference", async () => {
		document.cookie = "theme=system";
		prefersDarkValue.mockReturnValue(true);

		const { getRawTheme, getTheme, getThemeVariant, setTheme } = await import(
			"../../src/client/theme.ts"
		);

		expect(getRawTheme()).toBe("sdark");
		expect(getTheme()).toBe("dark");
		expect(getThemeVariant()).toBe("system");

		setTheme("light");
		expect(getRawTheme()).toBe("light");
		expect(getThemeVariant()).toBe("light");
	});

	it("writes theme side effects and injects the theme cookie script", async () => {
		const setAttribute = vi.spyOn(document.documentElement, "setAttribute");
		document.cookie = "theme=dark";

		const { setTheme, useThemeListener } = await import(
			"../../src/client/theme.ts"
		);

		const dispose = createRoot((dispose) => {
			setTheme("dark");
			useThemeListener();
			return dispose;
		});

		await Promise.resolve();
		await Promise.resolve();

		expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
		expect(document.cookie).toContain("theme=dark");
		expect(useHead).toHaveBeenCalledWith(
			expect.objectContaining({
				tag: "script",
				props: expect.objectContaining({
					children: "window.__theme = document.cookie",
				}),
			}),
		);
		setAttribute.mockRestore();
		dispose();
	});
});
