import { getLocale, getTheme } from "./client/index.jsx";

export function getHtmlProps() {
	return {
		lang: getLocale().code,
		"data-theme": getTheme(),
	};
}
