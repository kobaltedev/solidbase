// @vitest-environment jsdom

import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "../helpers/solid.js";

const useCurrentMatches = vi.fn();

vi.mock("@solidjs/router", () => ({
	// Solid Router 2: useRouteMatches() returns an accessor of the current matches
	useRouteMatches: () => () => useCurrentMatches(),
}));

// Solid's hydration re-runs async memos with the global Promise swapped for one that never
// settles (`subFetch`), restoring it once the compute returns.
const hydration = vi.hoisted(() => {
	class StubPromise {
		// biome-ignore lint/suspicious/noThenProperty: mirrors Solid's never-settling MockPromise
		then() {
			return new StubPromise();
		}
		catch() {
			return new StubPromise();
		}
		finally() {
			return new StubPromise();
		}
		static resolve() {
			return new StubPromise();
		}
	}
	return { stubPromise: false, StubPromise, NativePromise: Promise };
});

vi.mock("solid-js", async () => {
	const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
	return {
		...actual,
		// Solid 2 replaces createResource with async memos; the server build used under vitest
		// computes memos once, so shim the async case to resolve into a plain accessor.
		createMemo: (compute: () => unknown) => {
			let value: unknown;
			let result: unknown;
			if (hydration.stubPromise) {
				globalThis.Promise = hydration.StubPromise as any;
				try {
					result = compute();
				} finally {
					globalThis.Promise = hydration.NativePromise;
				}
			} else result = compute();
			if (result instanceof hydration.NativePromise)
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

	it("does not preload lazy routes under the hydration Promise stub", async () => {
		// A lazy() route as Vite builds it: the load chains off the global Promise and is cached.
		let load: Promise<any> | undefined;
		const preload = vi.fn(() => {
			load ??= Promise.resolve().then(() => ({
				$$SolidBase_page_data: { frontmatter: { title: "Loaded" } },
			}));
			return load;
		});
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

		hydration.stubPromise = true;
		const hydrated = readFrontmatter(CurrentPageDataProvider, useFrontmatter);
		hydration.stubPromise = false;
		await hydrated;

		// Navigating back to the route reuses the cached load, which must settle.
		expect(
			await readFrontmatter(CurrentPageDataProvider, useFrontmatter),
		).toEqual({ title: "Loaded" });
	});
});
