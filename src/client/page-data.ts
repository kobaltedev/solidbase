import { type RouteMatch, useCurrentMatches } from "@solidjs/router";
import {
	createContext,
	createEffect,
	createResource,
	useContext,
} from "solid-js";

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

const defaultPageData: CurrentPageData = {
	frontmatter: {},
	layout: {
		sidebar: true,
		footer: true,
		toc: true,
		editLink: true,
		lastUpdated: true,
	},
};

export const CurrentPageDataContext = createContext<() => CurrentPageData>();

export function useCurrentPageData() {
	const context = useContext(CurrentPageDataContext);

	if (context === undefined) {
		return createPageData();
	}

	return context;
}

function createPageData() {
	const matches = useCurrentMatches();

	const [pageData] = createResource(
		matches,
		async (m: RouteMatch[]): Promise<CurrentPageData> => {
			const key = m[m.length - 1]?.route.key as { $component: any } | undefined;
			if (!key) return defaultPageData;

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
					return computeLayout(
						// @ts-ignore
						window.$$SolidBase_page_data[
							component.src.split("?")[0]
						] as CurrentPageData,
					);
				}

				const manifest = import.meta.env.SSR
					? import.meta.env.MANIFEST.ssr
					: import.meta.env.MANIFEST.client;

				mod = await manifest.inputs[component.src]?.import();
			} else {
				mod = await component.import();
			}

			const pd = (mod?.$$SolidBase_page_data ??
				defaultPageData) as CurrentPageData;

			return computeLayout(pd);
		},
		{ initialValue: defaultPageData },
	);

	return pageData;
}

function computeLayout(pd: CurrentPageData): CurrentPageData {
	pd.layout = structuredClone(defaultPageData.layout);

	pd.layout!.prev = pd.frontmatter.prev;
	pd.layout!.next = pd.frontmatter.next;

	switch (pd.frontmatter.layout) {
		case "home":
			pd.layout!.editLink = false;
			pd.layout!.lastUpdated = false;
			pd.layout!.next = false;
			pd.layout!.prev = false;
			pd.layout!.sidebar = false;
			pd.layout!.toc = false;
			pd.layout!.footer = true;
	}

	for (const k in Object.keys(pd.layout ?? {})) {
		// @ts-ignore
		if (pd.frontmatter[k]) pd.layout[k] = pd.frontmatter[k];
	}

	return pd;
}
