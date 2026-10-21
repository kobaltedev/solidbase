import { solidBaseConfig } from "virtual:solidbase/config";
import { createOptionalContextProvider } from "@solid-primitives/context";
import { useMatch, useNavigate, useResolvedPath } from "@solidjs/router";
import { getRequestEvent, isServer } from "@solidjs/web";
import { createEffect, createMemo } from "solid-js";

import type { LocaleConfig } from "../config/index.js";
import {
	buildSolidBaseRoutePath,
	getSolidBaseRouteMatchForPath,
	getSolidBaseRouteOptions,
	getSolidBaseRoutePathWithRest,
	getSolidBaseRouteSelectionForPath,
	resolveSolidBaseRouteValueOverrides,
	type SolidBaseRouteOption,
} from "../config/route-config.js";
import {
	stripBasePath,
	trimTrailingSlash,
	useAppPathname,
} from "./base-path.js";
import { useSolidBaseRoutes } from "./routes.js";

export const DEFAULT_LANG_CODE = "en-US";
export const DEFAULT_LANG_LABEL = "English";
const LOCALE_AXIS = "locale";

export interface ResolvedLocale<ThemeConfig> {
	code: string;
	isRoot?: boolean;
	config: LocaleConfig<ThemeConfig>;
	option?: SolidBaseRouteOption;
}

function getRouteLocaleAxis() {
	const axis = solidBaseConfig.routes?.[LOCALE_AXIS];
	if (
		axis &&
		typeof axis === "object" &&
		"default" in axis &&
		"values" in axis
	) {
		return axis;
	}

	return undefined;
}

function routeOptionToLocale(
	option: SolidBaseRouteOption,
): ResolvedLocale<any> {
	return {
		code: option.meta.lang
			? String(option.meta.lang)
			: option.name === getRouteLocaleAxis()?.default
				? (solidBaseConfig.lang ?? DEFAULT_LANG_CODE)
				: option.name,
		isRoot: option.name === getRouteLocaleAxis()?.default,
		option,
		config: {
			label:
				typeof option.meta.label === "string"
					? option.meta.label
					: option.name === getRouteLocaleAxis()?.default
						? DEFAULT_LANG_LABEL
						: option.name,
			lang: typeof option.meta.lang === "string" ? option.meta.lang : undefined,
			link: option.path,
		},
	};
}

const legacyLocales = (() => {
	let rootHandled = false;

	const array: Array<ResolvedLocale<any>> = Object.entries(
		solidBaseConfig.locales ?? {},
	).map(([locale, config]) => {
		if (locale === "root") {
			rootHandled = true;
			return {
				code: config.lang ?? solidBaseConfig.lang ?? DEFAULT_LANG_CODE,
				config,
				isRoot: true,
			};
		}

		return { code: locale, config };
	});

	if (!rootHandled) {
		array.unshift({
			code: solidBaseConfig.lang ?? DEFAULT_LANG_CODE,
			isRoot: true,
			config: {
				label: DEFAULT_LANG_LABEL,
			},
		});
	}

	return array;
})();

function getLegacyLocaleForPath(path: string) {
	for (const locale of legacyLocales) {
		if (locale.isRoot) continue;

		// Paths have no trailing slash (see stripBasePath), links usually do (/fr/).
		const prefix = trimTrailingSlash(locale.config.link ?? `/${locale.code}`);
		if (isPathWithinPrefix(path, prefix)) return locale;
	}

	return legacyLocales.find((l) => l.isRoot)!;
}

function getRouteLocaleForPath(path: string) {
	const selection = getSolidBaseRouteSelectionForPath(
		solidBaseConfig.routes,
		path,
	);
	const value = selection?.[LOCALE_AXIS];
	if (!value) return undefined;

	const option = getSolidBaseRouteOptions(
		solidBaseConfig.routes,
		LOCALE_AXIS,
		{
			...selection,
			[LOCALE_AXIS]: value,
		},
		resolveSolidBaseRouteValueOverrides(
			solidBaseConfig.routes,
			solidBaseConfig.overrides ?? [],
			{
				...selection,
				[LOCALE_AXIS]: value,
			},
		),
	).find((option) => option.name === value);

	return option ? routeOptionToLocale(option) : undefined;
}

function getLocaleForPath(path: string) {
	return getRouteLocaleForPath(path) ?? getLegacyLocaleForPath(path);
}

function normalizeClientPath(path: string): `/${string}` {
	return (path.startsWith("/") ? path : `/${path}`) as `/${string}`;
}

function isExternalPath(path: string) {
	return path.includes("://") || path.startsWith("//");
}

function isPathWithinPrefix(path: string, prefix: string) {
	return path === prefix || path.startsWith(`${prefix}/`);
}

const [LocaleContextProvider, useLocaleContext] = createOptionalContextProvider(
	() => {
		const pathname = useAppPathname();
		const navigate = useNavigate();
		const routes = useSolidBaseRoutes();

		const currentLocale = createMemo(() => getLocaleForPath(pathname()));
		const currentRouteMatch = createMemo(() =>
			getSolidBaseRouteMatchForPath(solidBaseConfig.routes, pathname()),
		);
		const locales = createMemo(() => {
			if (!solidBaseConfig.routes) return legacyLocales;

			const match = currentRouteMatch();
			if (!match) return [];

			return routes
				.options(LOCALE_AXIS, match.selection)
				.map(routeOptionToLocale);
		});

		// The location includes the router base, so match against a resolved pattern.
		const localePattern = useResolvedPath(
			() => `${getLocaleLink(currentLocale())}*rest`,
		);
		const match = useMatch(() => localePattern() ?? "");

		// The document language follows the location, however it changed (locale
		// switcher, plain links, Back/Forward). Effects run once the navigation
		// commits, i.e. after the new route renders. Unguarded so server and client
		// owner trees (hydration ids) match; effects never run on the server.
		createEffect(
			() => currentLocale().code,
			(code) => {
				document.documentElement.lang = code;
			},
		);

		return {
			get locales() {
				return locales();
			},
			currentLocale,
			setLocale: (locale: ResolvedLocale<any>) => {
				if (locale.option) {
					const routePath = getSolidBaseRoutePathWithRest(
						solidBaseConfig.routes,
						{
							...routes.current(),
							[LOCALE_AXIS]: locale.option.name,
						},
						currentRouteMatch()?.restPath ?? "/",
					);

					if (!routePath) return;

					navigate(routePath);
					return;
				}

				const searchValue = getLocaleLink(locale);

				navigate(`${searchValue}${match()?.params.rest ?? ""}`);
			},
			applyPathPrefix: (_path: string): `/${string}` => {
				if (solidBaseConfig.routes && !isExternalPath(_path)) {
					const path = normalizeClientPath(_path);
					const pathMatch = getSolidBaseRouteMatchForPath(
						solidBaseConfig.routes,
						path,
					);
					const pathPrefix =
						pathMatch &&
						buildSolidBaseRoutePath(
							solidBaseConfig.routes,
							pathMatch.selection,
						);

					if (
						pathPrefix &&
						pathPrefix !== "/" &&
						isPathWithinPrefix(path, pathPrefix)
					) {
						return path;
					}

					const routePath = getSolidBaseRoutePathWithRest(
						solidBaseConfig.routes,
						routes.current(),
						path,
					);

					if (routePath) return routePath;
				}

				let path = _path;
				const link = getLocaleLink(currentLocale());

				if (link === "/") {
					const normalizedPath = path.startsWith("/") ? path : `/${path}`;
					return normalizedPath as `/${string}`;
				}

				if (path.startsWith("/")) path = path.slice(1);
				return `${link}${path}` as `/${string}`;
			},
			routePath: () => {
				const routePath = currentRouteMatch()?.restPath;
				if (routePath) return routePath;

				const rest = match()?.params.rest;

				if (!rest) return "/";
				return `/${rest}`;
			},
		};
	},
);

export { LocaleContextProvider };

export function useLocale() {
	return (
		useLocaleContext() ??
		(() => {
			throw new Error(
				"useLocale must be called underneath a LocaleContextProvider",
			);
		})()
	);
}

export const getLocaleLink = (locale: ResolvedLocale<any>): `/${string}` =>
	(locale.option?.path ??
		locale.config?.link ??
		`/${locale.isRoot ? "" : `${locale.code}/`}`) as any;

export function getLocale(_path?: string) {
	let path = _path;
	if (path === undefined) {
		if (isServer) {
			const e = getRequestEvent();
			if (!e) throw new Error("getLang must be called in a request context");

			path = new URL(e.request.url).pathname;
		} else {
			path = location.pathname;
		}
		// Called outside the router (eg. the document shell), so strip Vite's base,
		// which is what apps configure as the router base.
		path = stripBasePath(path, import.meta.env.BASE_URL);
	}

	return getLocaleForPath(path);
}
