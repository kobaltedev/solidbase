import { getSitemapHostname, type SolidBaseResolvedConfig } from "./index.js";
import { getRoutesIndex, type RouteIndexEntry } from "./routes-index.js";

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

type LocaleRouteInfo = {
	locale: string;
	hreflang: string;
	groupPath: string;
};

type LocaleDefinition = {
	locale: string;
	prefix: string;
	hreflang: string;
};

function normalizeHostname(hostname: string) {
	return hostname.endsWith("/") ? hostname : `${hostname}/`;
}

function normalizeLocalePrefix(prefix: string) {
	if (prefix === "/") return "/";
	return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
}

function getLocaleDefinitions(config: SolidBaseResolvedConfig<any>) {
	const locales = config.locales ?? {};
	const definitions: LocaleDefinition[] = [
		{
			locale: "root",
			prefix: "/",
			hreflang: config.lang,
		},
	];

	for (const [locale, localeConfig] of Object.entries(locales)) {
		if (locale === "root") continue;

		definitions.push({
			locale,
			prefix: normalizeLocalePrefix(localeConfig.link ?? `/${locale}/`),
			hreflang: localeConfig.lang ?? locale,
		});
	}

	return definitions.sort((a, b) => b.prefix.length - a.prefix.length);
}

function getLocaleRouteInfo(
	routePath: string,
	config: SolidBaseResolvedConfig<any>,
): LocaleRouteInfo {
	for (const definition of getLocaleDefinitions(config)) {
		if (definition.locale === "root") continue;
		if (routePath === definition.prefix) {
			return {
				locale: definition.locale,
				hreflang: definition.hreflang,
				groupPath: "/",
			};
		}

		if (routePath.startsWith(`${definition.prefix}/`)) {
			return {
				locale: definition.locale,
				hreflang: definition.hreflang,
				groupPath: routePath.slice(definition.prefix.length),
			};
		}
	}

	return {
		locale: "root",
		hreflang: config.lang,
		groupPath: routePath,
	};
}

function isSitemapExcluded(frontmatter: SitemapFrontmatter) {
	if (frontmatter.sitemap === false) return true;
	if (frontmatter.sitemap && typeof frontmatter.sitemap === "object") {
		return frontmatter.sitemap.exclude === true;
	}

	return false;
}

function toAbsoluteUrl(hostname: string, routePath: string) {
	return new URL(routePath, normalizeHostname(hostname)).toString();
}

export function buildSitemapEntries(
	hostname: string,
	config: SolidBaseResolvedConfig<any>,
	routes: RouteIndexEntry[],
): SitemapEntry[] {
	const includedRoutes = routes.filter(
		(route) => !isSitemapExcluded(route.frontmatter as SitemapFrontmatter),
	);

	const groups = new Map<
		string,
		Array<{ routePath: string; url: string; hreflang: string; locale: string }>
	>();

	for (const route of includedRoutes) {
		const localeInfo = getLocaleRouteInfo(route.routePath, config);
		const entry = {
			routePath: route.routePath,
			url: toAbsoluteUrl(hostname, route.routePath),
			hreflang: localeInfo.hreflang,
			locale: localeInfo.locale,
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
			const localeInfo = getLocaleRouteInfo(route.routePath, config);
			const variants = groups.get(localeInfo.groupPath) ?? [];

			return {
				routePath: route.routePath,
				url: toAbsoluteUrl(hostname, route.routePath),
				alternates: variants
					.map(({ hreflang, url }) => ({ hreflang, href: url }))
					.sort(
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
