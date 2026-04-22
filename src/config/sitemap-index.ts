import {
	getSitemapHostname,
	normalizeSiteUrl,
	type SolidBaseResolvedConfig,
} from "./index.js";
import {
	getRouteLocaleMetadata,
	getRoutesIndex,
	isRouteIncludedByConfig,
	type RouteIndexEntry,
} from "./routes-index.js";

type SitemapFrontmatter = {
	sitemap?: boolean | { exclude?: boolean };
};

export type SitemapAlternate = {
	hreflang: string;
	href: string;
};

export type SitemapEntry = {
	routePath: string;
	url: string;
	alternates: SitemapAlternate[];
};

function isSitemapExcluded(frontmatter: SitemapFrontmatter) {
	if (frontmatter.sitemap === false) return true;
	if (frontmatter.sitemap && typeof frontmatter.sitemap === "object") {
		return frontmatter.sitemap.exclude === true;
	}

	return false;
}

function toAbsoluteUrl(hostname: string, routePath: string) {
	return new URL(routePath, normalizeSiteUrl(hostname)).toString();
}

export function buildSitemapEntries(
	hostname: string,
	config: SolidBaseResolvedConfig<any>,
	routes: RouteIndexEntry[],
): SitemapEntry[] {
	const includedRoutes = routes.filter(
		(route) =>
			!isSitemapExcluded(route.frontmatter as SitemapFrontmatter) &&
			isRouteIncludedByConfig(route.routePath, config),
	);

	const groups = new Map<
		string,
		Array<{
			routePath: string;
			url: string;
			hreflang: string;
			locale: string;
			isDefaultLocale: boolean;
		}>
	>();

	for (const route of includedRoutes) {
		const localeInfo = getRouteLocaleMetadata(route.routePath, config);
		const entry = {
			routePath: route.routePath,
			url: toAbsoluteUrl(hostname, route.routePath),
			hreflang: localeInfo.hreflang,
			locale: localeInfo.locale,
			isDefaultLocale: localeInfo.isDefaultLocale,
		};

		const group = groups.get(localeInfo.groupPath);
		if (group) {
			group.push(entry);
		} else {
			groups.set(localeInfo.groupPath, [entry]);
		}
	}

	return includedRoutes
		.map((route) => {
			const localeInfo = getRouteLocaleMetadata(route.routePath, config);
			const variants = groups.get(localeInfo.groupPath) ?? [];

			return {
				routePath: route.routePath,
				url: toAbsoluteUrl(hostname, route.routePath),
				alternates: [
					...variants.map(({ hreflang, url }) => ({ hreflang, href: url })),
					...(variants.length > 1
						? (() => {
								const defaultVariant = variants.find(
									(variant) => variant.isDefaultLocale,
								);
								return defaultVariant
									? [{ hreflang: "x-default", href: defaultVariant.url }]
									: [];
							})()
						: []),
				].sort(
					(a, b) =>
						a.hreflang.localeCompare(b.hreflang) ||
						a.href.localeCompare(b.href),
				),
			} satisfies SitemapEntry;
		})
		.sort((a, b) => a.routePath.localeCompare(b.routePath));
}

export async function getSitemapEntries(
	root: string,
	config: SolidBaseResolvedConfig<any>,
) {
	const hostname = getSitemapHostname(config);
	if (!hostname) return [];

	const routes = await getRoutesIndex(root);
	return buildSitemapEntries(hostname, config, routes);
}
