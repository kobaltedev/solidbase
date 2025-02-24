import { useCurrentMatches } from "@solidjs/router";
import { createResource } from "solid-js";
import { createContextProvider } from "@solid-primitives/context"

export interface TableOfContentsItemData {
	title: string;
	href: string;
	children: Array<TableOfContentsItemData>;
}

export type RelativePageConfig =
	| string
	| false
	| {
			text?: string;
			link?: string;
	  };

interface LayoutOptions {
	sidebar: boolean;
	footer: boolean;
	toc: boolean;
	prev?: RelativePageConfig;
	next?: RelativePageConfig;
	editLink: boolean;
	lastUpdated: boolean;
}

interface HeroActionConfig {
	theme?: string;
	text?: string;
	link?: string;
}

interface HeroConfig {
	name?: string;
	text?: string;
	tagline?: string;
	image?: {
		src: string;
		alt?: string;
	};
	actions?: Array<HeroActionConfig>;
}

interface FeaturesConfig {
	icon?: string;
	title?: string;
	details?: string;
}

interface FrontmatterData extends Partial<LayoutOptions> {
	title?: string;
	layout?: "home";
	hero?: HeroConfig;
	features?: Array<FeaturesConfig>;
}

interface CurrentPageData {
	frontmatter: FrontmatterData &
		Omit<Record<string, any>, keyof FrontmatterData>;
	toc?: Array<TableOfContentsItemData>;
	editLink?: string;
	lastUpdated?: number;
	layout?: LayoutOptions;
}

const [CurrentPageDataProvider, useCurrentPageDataContext] = createContextProvider((props: { deferStream?: boolean }) => {
	const matches = useCurrentMatches();

	const [pageData] = createResource(
		matches,
		async (m): Promise<CurrentPageData> => {
			const key = m[m.length - 1]?.route.key as { $component: any } | undefined;
			if (!key) throw new Error("Failed to get page data: no key found");

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
					const pageData = (window as Record<string, any>).$$SolidBase_page_data[
						component.src.split("?")[0]
					];
					if (!pageData) throw new Error("Failed to get page data: no page data");
					return pageData;
				}

				const manifest = import.meta.env.SSR
					? import.meta.env.MANIFEST.ssr
					: import.meta.env.MANIFEST.client;

				mod = await manifest.inputs[component.src]?.import();
			} else {
				mod = await component.import();
			}

			if (!mod) throw new Error("Failed to get page data: module not found");
			return mod.$$SolidBase_page_data;
		},
		{ get deferStream() { return props.deferStream } }
	);

	return () => pageData();
});

export { CurrentPageDataProvider };

export function useCurrentPageData() {
	return useCurrentPageDataContext() ?? (() => {
		throw new Error("useCurrentPageData must be called underneath a CurrentPageDataProvider");
 	})();
}

export function useFrontmatter<T extends Record<string, any>>() {
	const pageData = useCurrentPageData();

	return () => pageData()?.frontmatter as T | undefined
}
