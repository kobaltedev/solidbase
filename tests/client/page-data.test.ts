// @vitest-environment jsdom

import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "../helpers/solid.js";

const useCurrentMatches = vi.fn();

vi.mock("@solidjs/router", () => ({
	// Solid Router 2: useRouteMatches() returns an accessor of the current matches
	useRouteMatches: () => () => useCurrentMatches(),
}));

vi.mock("solid-js", async () => {
	const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
	return {
		...actual,
		// Solid 2 replaces createResource with async memos; the server build used under vitest
		// computes memos once, so shim the async case to resolve into a plain accessor.
		createMemo: (compute: () => unknown) => {
			let value: unknown;
			const result = compute();
			if (result instanceof Promise)
				result.then((resolved) => (value = resolved));
			else value = result;
			return () => value;
		},
	};
});

describe("page data helpers", () => {
	const pagePath = "tests/fixtures/page.mdx";

	afterEach(() => {
		useCurrentMatches.mockReset();
		vi.resetModules();
		(window as any).$$SolidBase_page_data = undefined;
	});

	it("reads current page data from the window cache in dev", async () => {
		useCurrentMatches.mockReturnValue([
			{
				route: { key: { $component: { src: `${pagePath}?import` } } },
			},
		]);
		(window as any).$$SolidBase_page_data = {
			[pagePath]: {
				frontmatter: { title: "Hello", description: "World" },
			},
		};

		const { CurrentPageDataProvider, useCurrentPageData, useFrontmatter } =
			await import("../../src/client/page-data.ts");

		let _pageData: ReturnType<typeof useCurrentPageData> | undefined;
		let frontmatter: ReturnType<typeof useFrontmatter<any>> | undefined;

		const dispose = createRoot((dispose) => {
			mount(
				CurrentPageDataProvider({
					get children() {
						_pageData = useCurrentPageData();
						frontmatter = useFrontmatter();
						return null;
					},
				} as any),
			);
			return dispose;
		});

		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect(frontmatter?.()).toEqual({
			title: "Hello",
			description: "World",
		});
		dispose();
	});

	const readFrontmatter = async (
		CurrentPageDataProvider: any,
		useFrontmatter: () => () => any,
	) => {
		let frontmatter: (() => any) | undefined;
		const dispose = createRoot((dispose) => {
			mount(
				CurrentPageDataProvider({
					get children() {
						frontmatter = useFrontmatter();
						return null;
					},
				}),
			);
			return dispose;
		});
		for (let i = 0; i < 4; i++) await Promise.resolve();
		const value = frontmatter?.();
		dispose();
		return value;
	};

	it("reads lazy routes from the window cache by moduleUrl", async () => {
		const preload = vi.fn();
		useCurrentMatches.mockReturnValue([
			{
				route: {
					component: {
						preload,
						moduleUrl:
							"src/routes/page.mdx?pick=$css&pick=$$SolidBase_page_data",
					},
				},
			},
		]);
		(window as any).$$SolidBase_page_data = {
			"src/routes/page.mdx": { frontmatter: { title: "Lazy" } },
		};

		const { CurrentPageDataProvider, useFrontmatter } = await import(
			"../../src/client/page-data.ts"
		);

		expect(
			await readFrontmatter(CurrentPageDataProvider, useFrontmatter),
		).toEqual({ title: "Lazy" });
		expect(preload).not.toHaveBeenCalled();
	});

	// Solid re-runs async memos during hydration with a stubbed global Promise until their first
	// await; a lazy route preloaded synchronously there caches a promise that never settles.
	it("preloads lazy routes only after the compute's synchronous part", async () => {
		const preload = vi.fn(async () => ({
			$$SolidBase_page_data: { frontmatter: { title: "Loaded" } },
		}));
		useCurrentMatches.mockReturnValue([
			{
				route: {
					component: { preload, moduleUrl: "src/routes/app.tsx?pick=default" },
				},
			},
		]);

		const { CurrentPageDataProvider, useFrontmatter } = await import(
			"../../src/client/page-data.ts"
		);

		const result = readFrontmatter(CurrentPageDataProvider, () => {
			expect(preload).not.toHaveBeenCalled();
			return useFrontmatter();
		});
		expect(await result).toEqual({ title: "Loaded" });
		expect(preload).toHaveBeenCalledOnce();
	});
});
