import { createComponent, createRoot, getOwner } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const createMediaQuery = vi.fn(() => {
	expect(getOwner()).not.toBeNull();
	return () => false;
});

vi.mock("@solid-primitives/media", () => ({ createMediaQuery }));

vi.mock("../../src/default-theme/frontmatter.js", () => ({
	useDefaultThemeFrontmatter: () => () => undefined,
}));

describe("DefaultThemeStateProvider", () => {
	afterEach(() => {
		createMediaQuery.mockClear();
	});

	it("owns responsive layout state with a desktop hydration fallback", async () => {
		const { DefaultThemeStateProvider, useDefaultThemeState } = await import(
			"../../src/default-theme/context.tsx"
		);

		createRoot((dispose) => {
			let state: ReturnType<typeof useDefaultThemeState> | undefined;

			createComponent(DefaultThemeStateProvider, {
				get children() {
					state = useDefaultThemeState();
					return null;
				},
			});

			expect(createMediaQuery).toHaveBeenCalledWith(
				"(max-width: 1100px)",
				false,
			);
			expect(state?.mobileLayout()).toBe(false);
			dispose();
		});
	});

	it("keeps the mobile layout deep import connected to provider state", async () => {
		const [{ DefaultThemeStateProvider }, { mobileLayout }] = await Promise.all(
			[
				import("../../src/default-theme/context.tsx"),
				import("../../src/default-theme/globals.ts"),
			],
		);

		createRoot((dispose) => {
			let isMobile: boolean | undefined;

			createComponent(DefaultThemeStateProvider, {
				get children() {
					isMobile = mobileLayout();
					return null;
				},
			});

			expect(isMobile).toBe(false);
			dispose();
		});
	});
});
