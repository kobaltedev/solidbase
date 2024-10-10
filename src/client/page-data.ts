import { type RouteMatch, useCurrentMatches } from "@solidjs/router";
import { createContext, createResource, useContext } from "solid-js";

export interface TableOfContentData {
	title: string;
	url: string;
	children: Array<TableOfContentData>;
}

interface CurrentPageData {
	frontmatter: Record<string, any>;
	toc?: TableOfContentData;
	editLink?: string;
}

const defaultPageData: CurrentPageData = {
	frontmatter: {},
};

export const CurrentPageDataContext = createContext<() => CurrentPageData>();

export function useCurrentPageData() {
	const context = useContext(CurrentPageDataContext);

	if (context === undefined) {
		return getPageData();
	}

	return context;
}

function getPageData() {
	const matches = useCurrentMatches();

	const [pageData] = createResource(
		matches,
		async (m: RouteMatch[]) => {
			const key = m[m.length - 1].route.key as any;
			const component = key.$component;

			let mod: any;

			// modelled after Start's lazyRoute
			// https://github.com/solidjs/solid-start/blob/main/packages/start/src/router/lazyRoute.ts
			if (import.meta.env.DEV) {
				if (
					typeof window !== "undefined" &&
					// @ts-ignore
					typeof window.$$SolidBase_page_data !== "undefined" &&
					// @ts-ignore
					typeof window.$$SolidBase_page_data[component.src.split("?")[0]] !==
						"undefined"
				) {
					// @ts-ignore
					return window.$$SolidBase_page_data[
						component.src.split("?")[0]
					] as CurrentPageData;
				}

				const manifest = import.meta.env.SSR
					? import.meta.env.MANIFEST.ssr
					: import.meta.env.MANIFEST.client;

				mod = await manifest.inputs[component.src]?.import();
			} else {
				mod = await component.import();
			}

			return (mod?.$$SolidBase_page_data ?? defaultPageData) as CurrentPageData;
		},
		{ initialValue: defaultPageData },
	);

	return pageData;
}
