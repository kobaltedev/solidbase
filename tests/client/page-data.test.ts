// @vitest-environment jsdom

import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const useCurrentMatches = vi.fn();

vi.mock("@solidjs/router", () => ({
	useCurrentMatches,
}));

vi.mock("solid-js", async () => {
	const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
	return {
		...actual,
		createResource: (source: any, fetcher: (value: any) => Promise<any>) => {
			let value: any;
			Promise.resolve(typeof source === "function" ? source() : source)
				.then((resolved) => fetcher(resolved))
				.then((resolved) => {
					value = resolved;
				});
			return [() => value] as const;
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
				llmText: "Hello world",
			},
		};

		const { CurrentPageDataProvider, useCurrentPageData, useFrontmatter } =
			await import("../../src/client/page-data.ts");

		let pageData: ReturnType<typeof useCurrentPageData> | undefined;
		let frontmatter: ReturnType<typeof useFrontmatter<any>> | undefined;

		const dispose = createRoot((dispose) => {
			CurrentPageDataProvider({
				get children() {
					pageData = useCurrentPageData();
					frontmatter = useFrontmatter();
					return null;
				},
			} as any);
			return dispose;
		});

		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect((pageData?.() as any)?.llmText).toBe("Hello world");
		expect(frontmatter?.()).toEqual({
			title: "Hello",
			description: "World",
		});
		dispose();
	});
});
