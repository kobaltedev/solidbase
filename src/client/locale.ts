import { solidBaseConfig } from "virtual:solidbase";
import { useLocation, useMatch, useNavigate } from "@solidjs/router";
import { createMemo, startTransition } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import type { LocaleConfig } from "../config";

export const DEFAULT_LANG_CODE = "en-US";
export const DEFAULT_LANG_LABEL = "English";

export interface ResolvedLocale {
	code: string;
	isRoot?: boolean;
	config: LocaleConfig;
}

const locales = (() => {
	let rootHandled = false;

	const array: Array<ResolvedLocale> = Object.entries(
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

function getLocaleForPath(path: string) {
	for (const locale of locales) {
		if (locale.isRoot) continue;

		if (path.startsWith(locale.config.link ?? `/${locale.code}`)) return locale;
	}

	return locales.find((l) => l.isRoot)!;
}

export function useLocale() {
	const location = useLocation();
	const navigate = useNavigate();

	const currentLocale = createMemo(() => getLocaleForPath(location.pathname));

	const getLocaleLink = (locale: ResolvedLocale) =>
		locale.config?.link ?? `/${locale.isRoot ? "" : `${locale.code}/`}`;
	const match = useMatch(() => `${getLocaleLink(currentLocale())}*rest`);

	return {
		locales,
		currentLocale,
		setLocale: (locale: ResolvedLocale) => {
			const searchValue = getLocaleLink(locale);

			startTransition(() =>
				navigate(`${searchValue}${match()?.params.rest ?? ""}`),
			).then(() => {
				document.documentElement.lang = locale.code;
			});
		},
	};
}

export function getLocale() {
	let path: string;

	if (isServer) {
		const e = getRequestEvent();
		if (!e) throw new Error("getLang must be called in a request context");

		path = new URL(e.request.url).pathname;
	} else {
		path = location.pathname;
	}

	return getLocaleForPath(path);
}
