// @vitest-environment jsdom

import { createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "../helpers/solid.js";

const prefersDarkValue = vi.fn<() => boolean>(() => false);
const Script = vi.fn(() => null);

vi.mock("@solid-primitives/media", () => ({
	usePrefersDark: () => prefersDarkValue,
}));

vi.mock("solid-js", async () => {
	const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
	return {
		...actual,
		// Solid 2 effects are split: compute -> apply. Run both synchronously for the test.
		createEffect: (compute: () => unknown, apply: (value: unknown) => void) =>
			apply(compute()),
	};
});

vi.mock("@solidjs/meta", () => ({
	Script,
}));

vi.mock("@solidjs/web", () => ({
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
		Script.mockClear();
		vi.resetModules();
		// biome-ignore lint/suspicious/noDocumentCookie: test
		document.cookie = "";
	});

	it("derives raw theme, variant, and theme from cookies and system preference", async () => {
		// biome-ignore lint/suspicious/noDocumentCookie: test
		document.cookie = "theme=system";
		prefersDarkValue.mockReturnValue(true);

		const { getRawTheme, getTheme, getThemeVariant, setTheme } = await import(
			"../../src/client/theme.ts"
		);

		expect(getRawTheme()).toBe("sdark");
		expect(getTheme()).toBe("dark");
		expect(getThemeVariant()).toBe("system");

		setTheme("light");
		flush(); // Solid 2 batches writes until the microtask flush
		expect(getRawTheme()).toBe("light");
		expect(getThemeVariant()).toBe("light");
	});

	it("writes theme side effects and injects the theme cookie script", async () => {
		const setAttribute = vi.spyOn(document.documentElement, "setAttribute");
		// biome-ignore lint/suspicious/noDocumentCookie: test
		document.cookie = "theme=dark";

		const { setTheme, ThemeCookieScript, useThemeListener } = await import(
			"../../src/client/theme.ts"
		);

		// Solid 2: reactive writes are not allowed inside an owned scope (createRoot), so set first.
		setTheme("dark");
		flush();
		const dispose = createRoot((dispose) => {
			useThemeListener();
			mount(ThemeCookieScript());
			return dispose;
		});

		await Promise.resolve();
		await Promise.resolve();

		expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
		expect(document.cookie).toContain("theme=dark");
		expect(Script).toHaveBeenCalledWith(
			expect.objectContaining({
				children: "window.__theme = document.cookie",
			}),
		);
		setAttribute.mockRestore();
		dispose();
	});
});
