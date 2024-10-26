import { getLocale, getTheme } from "./client";

export function getHtmlProps() {
	return {
		lang: getLocale().code,
		"data-theme": getTheme(),
	};
}
