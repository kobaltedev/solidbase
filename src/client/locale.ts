import { useLocation } from "@solidjs/router";
import { createEffect, createMemo } from "solid-js";

import { getLangForPath } from "./lang";

export function useDocumentLocaleEffect() {
	const location = useLocation();

	createEffect(() => {
		const locale = getLangForPath(location.pathname);
		if (!locale) return;

		document.documentElement.lang = locale.code;
	});
}

export function useDocumentLocale() {
	const location = useLocation();
	return createMemo(() => getLangForPath(location.pathname));
}
