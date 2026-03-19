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

describe("createSolidBase", () => {
	it("applies defaults and returns mdx, core, and theme plugins", async () => {
		solidBaseMdx.mockReset();
		solidBaseVitePlugin.mockReset();
		solidBaseMdx.mockReturnValue("mdx-plugin");
		solidBaseVitePlugin.mockReturnValue("solidbase-plugin");

		const { createSolidBase } = await import("../../src/config/index.ts");
		const theme = {
			componentsPath: "/themes/custom",
			config: vi.fn(),
			vite: vi.fn(() => "theme-plugin"),
		} as any;

		const solidBase = createSolidBase(theme);
		const config = solidBase.startConfig({
			extensions: ["tsx", "md"],
		});
		const plugins = solidBase.plugin({ title: "Docs", llms: true });

		expect(config.extensions).toEqual(["tsx", "md", "mdx"]);
		expect(config.ssr).toBe(true);
		expect(theme.config).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Docs",
				llms: true,
				sitemap: false,
				lang: "en-US",
				issueAutolink: false,
			}),
		);
		expect(plugins).toEqual(["mdx-plugin", "solidbase-plugin", "theme-plugin"]);
		expect(solidBaseMdx).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Docs", llms: true, sitemap: false }),
		);
		expect(solidBaseVitePlugin).toHaveBeenCalledWith(
			theme,
			expect.objectContaining({ title: "Docs", llms: true, sitemap: false }),
		);
	});

	it("merges inherited theme config hooks and reverses theme vite order", async () => {
		solidBaseMdx.mockReset();
		solidBaseVitePlugin.mockReset();
		solidBaseMdx.mockReturnValue("mdx-plugin");
		solidBaseVitePlugin.mockReturnValue("solidbase-plugin");

		const { createSolidBase } = await import("../../src/config/index.ts");
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

		const solidBase = createSolidBase(child);
		const plugins = solidBase.plugin();

		expect(child.config.mock.invocationCallOrder[0]).toBeLessThan(
			parent.config.mock.invocationCallOrder[0],
		);
		expect(parent.config).toHaveBeenCalled();
		expect(child.vite.mock.invocationCallOrder[0]).toBeLessThan(
			parent.vite.mock.invocationCallOrder[0],
		);
		expect((plugins as any[]).slice(-2)).toEqual([
			"parent-plugin",
			"child-plugin",
		]);
	});
});
