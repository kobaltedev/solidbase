import {
	PageFileSystemRouter,
	type RouteManifestEntry,
} from "filesystem-routing";
import {
	DEFAULT_EXTENSIONS,
	type FileRoutesOptions,
	fileRoutes,
} from "filesystem-routing/vite";
import type { PluginOption } from "vite";

/** Export appended to every compiled MDX module by the SolidBase Vite plugin. */
export const PAGE_DATA_EXPORT = "$$SolidBase_page_data";
const MARKDOWN_EXTENSIONS = ["md", "mdx"];
const MARKDOWN_RE = /\.mdx?$/;
const BASE_ROUTER = Symbol("solidbase.baseRouter");

/**
 * File-system routes for a SolidBase site, on top of `filesystem-routing` (the convention
 * SolidStart used, now router-neutral). Markdown files are pages out of the box; SolidBase only
 * adds `$$SolidBase_page_data` to the picked exports. `filesystem-routing` only tree-shakes picks
 * for js/ts routes today, so markdown modules load whole; the pick keeps page data if that changes.
 *
 * Apps consume the manifest from `virtual:file-routes` and hand it to the router:
 *
 * ```tsx
 * import { pageRoutes } from "virtual:file-routes";
 * import { createRouter } from "@solidjs/router";
 * import { fileRoutes } from "@solidjs/router/fs";
 * const Router = createRouter({ routes: fileRoutes(pageRoutes) });
 * ```
 */
/**
 * The route convention SolidBase uses: the stock `filesystem-routing` page convention, with
 * `$$SolidBase_page_data` added to the picked exports of markdown routes. Pass it as `toRoute`
 * when wiring `fileRoutes()` yourself (`fileRoutes: false` in the SolidBase config).
 */
export const solidBaseToRoute: NonNullable<FileRoutesOptions["toRoute"]> = (
	src,
	router,
) => {
	const holder = router as unknown as Record<symbol, PageFileSystemRouter>;
	const base = (holder[BASE_ROUTER] ??= new PageFileSystemRouter({
		...(router.config as ConstructorParameters<typeof PageFileSystemRouter>[0]),
		toRoute: undefined,
	}));
	const route: RouteManifestEntry | undefined = base.toRoute(src);
	const component = route?.$component;
	if (
		component &&
		MARKDOWN_RE.test(src) &&
		!component.pick.includes(PAGE_DATA_EXPORT)
	) {
		component.pick = [...component.pick, PAGE_DATA_EXPORT];
	}
	return route;
};

export function solidBaseFileRoutes(
	options: FileRoutesOptions = {},
): PluginOption[] {
	const extensions = [
		...new Set([
			...(options.extensions ?? DEFAULT_EXTENSIONS),
			...MARKDOWN_EXTENSIONS,
		]),
	];

	return fileRoutes({
		...options,
		extensions,
		toRoute: solidBaseToRoute,
	});
}
