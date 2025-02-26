import { usePrefersDark } from "@solid-primitives/media";
import { useHead } from "@solidjs/meta";
import { createEffect, createSignal, createUniqueId } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

export type ThemeType = "light" | "dark";
export type RawThemeType = ThemeType | `s${ThemeType}`;

function getCookie(name: string, cookieString: string) {
	if (!name || !cookieString) return "system";
	const match = cookieString.match(new RegExp(`\\W?${name}=(?<theme>\\w+)`));
	return match?.groups?.theme || "system";
}

function getThemeCookie(): RawThemeType {
	if (isServer) {
		const e = getRequestEvent()!;
		return (getCookie("theme", e.request.headers.get("cookie")!) ??
			"system") as RawThemeType;
	}
	return getCookie("theme", document.cookie) as RawThemeType;
}

const [theme, _setTheme] = createSignal<ThemeType | "system">();

export function getRawTheme(): RawThemeType {
	if (isServer) return getThemeCookie() as RawThemeType;

	const prefersDark = usePrefersDark();
	const prefersTheme = () => (prefersDark() ? "sdark" : "slight");

	if (theme())
		return theme()!.startsWith("s")
			? prefersTheme()
			: (theme()! as RawThemeType);

	const userTheme = getThemeCookie();
	if (userTheme && !userTheme.startsWith("s")) {
		setTheme(userTheme as ThemeType);
		return userTheme;
	}

	return prefersTheme();
}

export function getTheme(): ThemeType {
	return getRawTheme().replace("s", "") as ThemeType;
}

export function getThemeVariant() {
	const t = getRawTheme();
	if (t.startsWith("s")) return "system";
	return t as ThemeType;
}

export const setTheme = _setTheme;

import readThemeCookieScript from "./read-theme-cookie.js?raw";

export function useThemeListener() {
	createEffect(() => {
		document.documentElement.setAttribute("data-theme", getTheme());
		document.cookie = `theme=${getRawTheme()}; max-age=31536000; path=/`;
	});

	useHead({
		tag: "script",
		id: createUniqueId(),
		props: { children: readThemeCookieScript },
		setting: { close: true },
	});
}
