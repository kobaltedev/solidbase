import { useLocation, useResolvedPath } from "@solidjs/router";
import { type Accessor, createMemo } from "solid-js";

function isAppPath(href: unknown): href is `/${string}` {
	return (
		typeof href === "string" && href.startsWith("/") && !href.startsWith("//")
	);
}

/**
 * Removes a deployment base (eg. Vite's `base`) from a URL pathname. Paths outside
 * the base are returned unchanged.
 */
export function stripBasePath(pathname: string, base: string): string {
	const prefix = base.replace(/\/+$/, "");
	if (!prefix) return pathname;
	if (pathname.toLowerCase() === prefix.toLowerCase()) return "/";
	return pathname.toLowerCase().startsWith(`${prefix.toLowerCase()}/`)
		? pathname.slice(prefix.length)
		: pathname;
}

/**
 * The current pathname relative to the router base, ie. the path SolidBase routes,
 * locales and sidebars are defined against.
 */
export function useAppPathname(): Accessor<string> {
	const location = useLocation();
	const base = useResolvedPath(() => "/");
	return createMemo(() => stripBasePath(location.pathname, base() ?? "/"));
}

/**
 * Resolves an app-absolute href (`/guide`) against the router base, like router
 * navigation does, for use on plain anchors. Relative, hash and external hrefs
 * are returned unchanged.
 */
export function useResolvedHref<T>(
	href: Accessor<T>,
): Accessor<T | `/${string}`> {
	const resolved = useResolvedPath(() => {
		const path = href();
		return isAppPath(path) ? path : "/";
	});
	return () => {
		const path = href();
		if (!isAppPath(path)) return path;
		const result = resolved() ?? path;
		// Keep a trailing slash so links to the base root don't redirect on static hosts.
		return (
			path.endsWith("/") && !result.endsWith("/") ? `${result}/` : result
		) as `/${string}`;
	};
}
