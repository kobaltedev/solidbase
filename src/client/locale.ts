import { solidBaseConfig } from "virtual:solidbase/config";
import { createContextProvider } from "@solid-primitives/context";
import { useLocation, useMatch, useNavigate } from "@solidjs/router";
import { createMemo, startTransition } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

import type { LocaleConfig } from "../config/index.js";
import {
	buildSolidBaseRoutePath,
	getSolidBaseRouteMatchForPath,
	getSolidBaseRouteOptions,
	getSolidBaseRoutePathWithRest,
	getSolidBaseRouteSelectionForPath,
	type SolidBaseRouteOption,
} from "../config/route-config.js";
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

function routeOptionToLocale(option: SolidBaseRouteOption): ResolvedLocale<any> {
	return {
		code: option.meta.lang
			? String(option.meta.lang)
			: option.name === getRouteLocaleAxis()?.default
				? solidBaseConfig.lang ?? DEFAULT_LANG_CODE
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

		if (path.startsWith(locale.config.link ?? `/${locale.code}`)) return locale;
	}

	return legacyLocales.find((l) => l.isRoot)!;
}

function getRouteLocaleForPath(path: string) {
	const selection = getSolidBaseRouteSelectionForPath(solidBaseConfig.routes, path);
	const value = selection?.[LOCALE_AXIS];
	if (!value) return undefined;

	const option = getSolidBaseRouteOptions(solidBaseConfig.routes, LOCALE_AXIS, {
		...selection,
		[LOCALE_AXIS]: value,
	}).find((option) => option.name === value);

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

const [LocaleContextProvider, useLocaleContext] = createContextProvider(() => {
	const location = useLocation();
	const navigate = useNavigate();
	const routes = useSolidBaseRoutes();

	const currentLocale = createMemo(() => getLocaleForPath(location.pathname));
	const currentRouteMatch = createMemo(() =>
		getSolidBaseRouteMatchForPath(solidBaseConfig.routes, location.pathname),
	);
	const locales = createMemo(() => {
		if (!solidBaseConfig.routes) return legacyLocales;

		return routes.options(LOCALE_AXIS).map(routeOptionToLocale);
	});

	const match = useMatch(() => `${getLocaleLink(currentLocale())}*rest`);

	return {
		get locales() {
			return locales();
		},
		currentLocale,
		setLocale: (locale: ResolvedLocale<any>) => {
			const routePath =
				locale.option &&
				getSolidBaseRoutePathWithRest(
					solidBaseConfig.routes,
					{
						...routes.current(),
						[LOCALE_AXIS]: locale.option.name,
					},
					currentRouteMatch()?.restPath ?? "/",
				);

			const searchValue = routePath ?? getLocaleLink(locale);

			startTransition(() =>
				navigate(
					routePath ? searchValue : `${searchValue}${match()?.params.rest ?? ""}`,
				),
			).then(() => {
				document.documentElement.lang = locale.code;
			});
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
					buildSolidBaseRoutePath(solidBaseConfig.routes, pathMatch.selection);

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
});

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
	}

	return getLocaleForPath(path);
}
