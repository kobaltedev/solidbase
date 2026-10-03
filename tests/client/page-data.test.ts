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
});
