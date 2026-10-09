import { createContextProvider } from "@solid-primitives/context";
import { useRouteMatches } from "@solidjs/router";
import { createMemo, type MemoOptions } from "solid-js";

interface PageModuleRef {
	src?: string;
	import?: () => Promise<any>;
}

/**
 * Locate the route's page module. `@solidjs/router/fs` wraps file routes in `lazy()`, which
 * exposes `preload()` and `moduleUrl` (the manifest `src`). The 1.x SolidStart manifest shape
 * (`route.key.$component`) is kept as a fallback for custom route trees.
 */
function getPageModuleRef(route: unknown): PageModuleRef | undefined {
	const r = route as {
		component?: { preload?: () => Promise<any>; moduleUrl?: string };
		key?: { $component?: PageModuleRef };
	};
	if (typeof r?.component?.preload === "function") {
		const component = r.component;
		return { src: component.moduleUrl, import: () => component.preload!() };
	}
	return r?.key?.$component;
}

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
	createContextProvider((props: { deferStream?: boolean }) => {
		const matches = useRouteMatches();

		// Solid 2: async memos replace createResource; readers suspend via the nearest <Loading>.
		// `deferStream` keeps 1.x semantics: hold the first flush until page data settles, so the
		// page (and e.g. its <HttpStatusCode>) renders before the response head is committed.
		// The server memo honors it at runtime; it is not on the public MemoOptions type yet.
		const pageData = createMemo(
			async (): Promise<CurrentPageData | undefined> => {
				const m = matches();
				const lastMatch = m[m.length - 1];
				// if there's no matches that's not an us problem
				if (!lastMatch) return;

				const ref = getPageModuleRef(lastMatch.route);
				const windowPageData = getWindowPageData(ref?.src);

				if (windowPageData) return windowPageData;

				// Hydration re-runs this compute with a stubbed global Promise until its first await.
				// Preloading the lazy route under that stub caches a promise that never settles and
				// stalls every later navigation back to the route, so yield before loading.
				await undefined;
				const mod = ref?.import ? await ref.import() : undefined;

				if (!mod) throw new Error("Failed to get page data: module not found");
				return mod.$$SolidBase_page_data;
			},
			{ deferStream: props.deferStream ?? true } as MemoOptions<
				CurrentPageData | undefined
			>,
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
