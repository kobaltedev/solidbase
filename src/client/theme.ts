import { usePrefersDark } from "@solid-primitives/media";
import { Script } from "@solidjs/meta";
import { getRequestEvent, isServer } from "@solidjs/web";
import { createComponent, createEffect, createSignal } from "solid-js";

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

// Solid 2 forbids writing reactive state from inside a computation (the old code wrote the
// cookie value into the signal during `getRawTheme()`, which runs in an effect's compute phase).
// Seed the signal from the cookie on the client instead; the server reads the cookie per request.
function initialTheme(): ThemeType | "system" | undefined {
	if (isServer) return undefined;
	const userTheme = getThemeCookie();
	return userTheme && !userTheme.startsWith("s")
		? (userTheme as ThemeType)
		: undefined;
}

const [theme, _setTheme] = createSignal<ThemeType | "system" | undefined>(
	initialTheme(),
);

export function getRawTheme(): RawThemeType {
	if (isServer) return getThemeCookie() as RawThemeType;

	const prefersDark = usePrefersDark();
	const prefersTheme = () => (prefersDark() ? "sdark" : "slight");

	const current = theme();
	if (current)
		return current.startsWith("s") ? prefersTheme() : (current as RawThemeType);

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
	createEffect(
		() => getRawTheme(),
		(raw) => {
			document.documentElement.setAttribute("data-theme", raw);
			// biome-ignore lint/suspicious/noDocumentCookie: remove next major
			document.cookie = `theme=${raw}; max-age=31536000; path=/`;
		},
	);
}

/** Inline script that applies the theme cookie before hydration (prevents FOUC). Render once in the document head. */
export function ThemeCookieScript() {
	return createComponent(Script, {
		id: "sb-theme-script",
		children: readThemeCookieScript,
	});
}
