import { describe, expect, it, vi } from "vitest";

const solidBaseMdx = vi.fn();
const solidBaseVitePlugin = vi.fn();

vi.mock("../../src/config/mdx.ts", () => ({
	solidBaseMdx,
}));

vi.mock("../../src/config/vite-plugin/index.ts", () => ({
	default: solidBaseVitePlugin,
}));

vi.mock("../../src/default-theme/index.js", () => ({
	default: {
		componentsPath: "/themes/default",
	},
}));

describe("createWithSolidBase", () => {
	it("applies defaults, normalizes theme paths, and injects plugins", async () => {
		solidBaseMdx.mockReset();
		solidBaseVitePlugin.mockReset();
		solidBaseMdx.mockReturnValue("mdx-plugin");
		solidBaseVitePlugin.mockReturnValue("solidbase-plugin");

		const { createWithSolidBase } = await import("../../src/config/index.ts");
		const theme = {
			componentsPath: "/themes/custom/Layout.tsx",
			config: vi.fn(),
			vite: vi.fn(() => "theme-plugin"),
		} as any;

		const withTheme = createWithSolidBase(theme);
		const config = withTheme(
			{
				extensions: ["tsx", "md"],
				vite: { plugins: ["existing-plugin" as any] },
			},
			{ title: "Docs", llms: true },
		);

		expect(theme.componentsPath).toBe("/themes/custom");
		expect(process.env.PORT).toBeTruthy();
		expect(config.extensions).toEqual(["tsx", "md", "mdx"]);
		expect(config.server?.prerender).toEqual({ crawlLinks: true });
		expect(theme.config).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Docs",
				llms: true,
				lang: "en-US",
				issueAutolink: false,
			}),
		);

		const viteConfig = (config.vite as any)?.({});
		expect(viteConfig.optimizeDeps.exclude).toContain("fsevents");
		expect(viteConfig.plugins).toEqual([
			"existing-plugin",
			"mdx-plugin",
			"solidbase-plugin",
			"theme-plugin",
		]);
		expect(solidBaseMdx).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Docs", llms: true }),
		);
		expect(solidBaseVitePlugin).toHaveBeenCalledWith(
			theme,
			expect.objectContaining({ title: "Docs", llms: true }),
		);
	});

	it("merges inherited theme config hooks and reverses theme vite order", async () => {
		solidBaseMdx.mockReset();
		solidBaseVitePlugin.mockReset();
		solidBaseMdx.mockReturnValue("mdx-plugin");
		solidBaseVitePlugin.mockReturnValue("solidbase-plugin");

		const { createWithSolidBase } = await import("../../src/config/index.ts");
		const parent = {
			componentsPath: "/themes/parent",
			config: vi.fn(),
			vite: vi.fn(() => "parent-plugin"),
		} as any;
		const child = {
			componentsPath: "/themes/child",
			extends: parent,
			config: vi.fn(),
			vite: vi.fn(() => "child-plugin"),
		} as any;

		const withTheme = createWithSolidBase(child);
		const config = withTheme();
		(config.vite as any)?.({});

		expect(child.config.mock.invocationCallOrder[0]).toBeLessThan(
			parent.config.mock.invocationCallOrder[0],
		);
		expect(parent.config).toHaveBeenCalled();
		expect(child.vite.mock.invocationCallOrder[0]).toBeLessThan(
			parent.vite.mock.invocationCallOrder[0],
		);
		expect(((config.vite as any)?.({}) as any).plugins.slice(-2)).toEqual([
			"parent-plugin",
			"child-plugin",
		]);
	});
});
