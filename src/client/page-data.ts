import { createContextProvider } from "@solid-primitives/context";
import { useRouteMatches } from "@solidjs/router";
import { createMemo } from "solid-js";

function getWindowPageData(path?: string) {
	if (typeof window === "undefined" || !path) return;

	return (window as any).$$SolidBase_page_data?.[path.split("?")[0]!];
}

export interface TableOfContentsItemData {
	title: string;
	href: string;
	children: Array<TableOfContentsItemData>;
}

export interface BaseFrontmatter {
	title?: string;
	titleTemplate?: string;
	description?: string;
	llms?: false | { exclude?: boolean };
}

interface CurrentPageData {
	frontmatter: BaseFrontmatter;
	toc?: Array<TableOfContentsItemData>;
	editLink?: string;
	lastUpdated?: number;
}

const [CurrentPageDataProvider, useCurrentPageDataContext] =
	createContextProvider((_props: { deferStream?: boolean }) => {
		const matches = useRouteMatches();

		// Solid 2: async memos replace createResource; readers suspend via the nearest <Loading>.
		// TODO(solid2): 1.x `deferStream` has no equivalent yet; prop kept for API compatibility.
		const pageData = createMemo(
			async (): Promise<CurrentPageData | undefined> => {
				const m = matches();
				const lastMatch = m[m.length - 1];
				// if there's no matches that's not an us problem
				if (!lastMatch) return;

				const { $component } = lastMatch.route.key as {
					$component: { import?: () => Promise<any>; src?: string };
				};
				const windowPageData = getWindowPageData($component?.src);

				if (windowPageData) return windowPageData;

				const mod =
					typeof $component?.import === "function"
						? await $component.import()
						: undefined;

				if (!mod) throw new Error("Failed to get page data: module not found");
				return mod.$$SolidBase_page_data;
			},
		);

		return () => pageData();
	});

export { CurrentPageDataProvider };

export function useCurrentPageData() {
	return (
		useCurrentPageDataContext() ??
		(() => {
			throw new Error(
				"useCurrentPageData must be called underneath a CurrentPageDataProvider",
			);
		})()
	);
}

export function useFrontmatter<T extends Record<string, any>>() {
	const pageData = useCurrentPageData();

	return () => pageData()?.frontmatter as T | undefined;
}
