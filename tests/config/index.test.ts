import { describe, expect, it, vi } from "vitest";
import type { SolidBaseRoutesConfig } from "../../src/config/route-config.ts";

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

const validRoutes = {
	path: "/{version}/{locale}",
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
		},
	},
} satisfies SolidBaseRoutesConfig;

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
				robots: false,
				lang: "en-US",
				issueAutolink: false,
			}),
		);
		expect(plugins).toEqual(["mdx-plugin", "solidbase-plugin", "theme-plugin"]);
		expect(solidBaseMdx).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Docs",
				llms: true,
				sitemap: false,
				robots: false,
			}),
		);
		expect(solidBaseVitePlugin).toHaveBeenCalledWith(
			theme,
			expect.objectContaining({
				title: "Docs",
				llms: true,
				sitemap: false,
				robots: false,
			}),
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

	it("accepts valid route config and route overrides", async () => {
		solidBaseMdx.mockReset();
		solidBaseVitePlugin.mockReset();
		solidBaseMdx.mockReturnValue("mdx-plugin");
		solidBaseVitePlugin.mockReturnValue("solidbase-plugin");

		const { createSolidBase } = await import("../../src/config/index.ts");
		const theme = {
			componentsPath: "/themes/custom",
		} as any;

		const solidBase = createSolidBase(theme);

		expect(() =>
			solidBase.plugin({
				routes: validRoutes,
				overrides: [
					{ version: "v1", title: "v1" },
					{ locale: ["en", "fr"], themeConfig: { nav: [] } },
				],
			}),
		).not.toThrow();
	});

	it("rejects route paths that reference unknown axes", async () => {
		const { createSolidBase } = await import("../../src/config/index.ts");
		const solidBase = createSolidBase({ componentsPath: "/themes/custom" } as any);

		expect(() =>
			solidBase.plugin({
				routes: {
					...validRoutes,
					path: "/{version}/{project}",
				},
			}),
		).toThrow("unknown route axis `project`");
	});

	it("rejects route axes that are missing from the path", async () => {
		const { createSolidBase } = await import("../../src/config/index.ts");
		const solidBase = createSolidBase({ componentsPath: "/themes/custom" } as any);

		expect(() =>
			solidBase.plugin({
				routes: {
					...validRoutes,
					path: "/{version}",
				},
			}),
		).toThrow("`routes.locale` must be included");
	});

	it("rejects route defaults that are not route values", async () => {
		const { createSolidBase } = await import("../../src/config/index.ts");
		const solidBase = createSolidBase({ componentsPath: "/themes/custom" } as any);

		expect(() =>
			solidBase.plugin({
				routes: {
					...validRoutes,
					version: {
						...validRoutes.version,
						default: "missing",
					},
				},
			}),
		).toThrow("default` must reference a key");
	});

	it("rejects include rules with unknown axes or values", async () => {
		const { createSolidBase } = await import("../../src/config/index.ts");
		const solidBase = createSolidBase({ componentsPath: "/themes/custom" } as any);

		expect(() =>
			solidBase.plugin({
				routes: {
					...validRoutes,
					include: [{ project: "solid" }],
				},
			}),
		).toThrow("include` references unknown route axis `project`");

		expect(() =>
			solidBase.plugin({
				routes: {
					...validRoutes,
					include: [{ version: "missing" }],
				},
			}),
		).toThrow("include` references unknown `version` value `missing`");
	});

	it("rejects overrides with unknown route selectors or values", async () => {
		const { createSolidBase } = await import("../../src/config/index.ts");
		const solidBase = createSolidBase({ componentsPath: "/themes/custom" } as any);

		expect(() =>
			solidBase.plugin({
				routes: validRoutes,
				overrides: [{ project: "solid" }],
			}),
		).toThrow("unknown config key or route axis `project`");

		expect(() =>
			solidBase.plugin({
				routes: validRoutes,
				overrides: [{ version: "missing" }],
			}),
		).toThrow("overrides` references unknown `version` value `missing`");
	});
});
