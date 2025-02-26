import { createContextProvider } from "@solid-primitives/context";
import { useCurrentMatches } from "@solidjs/router";
import { createResource } from "solid-js";

export interface TableOfContentsItemData {
	title: string;
	href: string;
	children: Array<TableOfContentsItemData>;
}

export interface BaseFrontmatter {
	title?: string;
	titleTemplate?: string;
	description?: string;
}

interface CurrentPageData {
	frontmatter: BaseFrontmatter;
	toc?: Array<TableOfContentsItemData>;
	editLink?: string;
	lastUpdated?: number;
}

const [CurrentPageDataProvider, useCurrentPageDataContext] =
	createContextProvider((props: { deferStream?: boolean }) => {
		const matches = useCurrentMatches();

		const [pageData] = createResource(
			matches,
			async (m): Promise<CurrentPageData | undefined> => {
				const lastMatch = m[m.length - 1];
				// if there's no matches that's not an us problem
				if (!lastMatch) return;

				const { $component } = lastMatch.route.key as { $component: any };

				let mod: any;

				// modelled after Start's lazyRoute
				// https://github.com/solidjs/solid-start/blob/main/packages/start/src/router/lazyRoute.ts
				if (import.meta.env.DEV) {
					if (
						typeof window !== "undefined" &&
						// @ts-ignore
						typeof window.$$SolidBase_page_data !== "undefined" &&
						// @ts-ignore
						typeof window.$$SolidBase_page_data[$component.src.split("?")[0]] !==
							"undefined"
					) {
						const pageData = (window as Record<string, any>)
							.$$SolidBase_page_data[$component.src.split("?")[0]];
						if (!pageData)
							throw new Error("Failed to get page data: no page data");
						return pageData;
					}

					const manifest = import.meta.env.SSR
						? import.meta.env.MANIFEST.ssr
						: import.meta.env.MANIFEST.client;

					mod = await manifest.inputs[$component.src]?.import();
				} else mod = await $component.import();

				if (!mod) throw new Error("Failed to get page data: module not found");
				return mod.$$SolidBase_page_data;
			},
			{
				get deferStream() {
					return props.deferStream ?? true;
				},
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
