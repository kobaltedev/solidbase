import { usePrefersDark } from "@solid-primitives/media";
import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { getCookie as getServerCookie } from "vinxi/server";

export type ThemeType = "light" | "dark";
export type RawThemeType = ThemeType | `s${ThemeType}`;

function getClientCookie(name: string) {
	if (!name || !document.cookie) return undefined;
	const match = document.cookie.match(new RegExp(`\\W?${name}=(?<value>\\w+)`));
	return match?.groups?.value || undefined;
}

function getServerTheme() {
	"use server";

	return (getServerCookie("theme") ?? "light") as ThemeType;
}

const [theme, _setTheme] = createSignal<ThemeType | "system">();

export function getRawTheme(): RawThemeType {
	if (isServer) return getServerTheme();

	const prefersDark = usePrefersDark();
	const prefersTheme = () => (prefersDark() ? "sdark" : "slight");

	if (theme())
		return theme()!.startsWith("s")
			? prefersTheme()
			: (theme()! as RawThemeType);

	const userTheme = getClientCookie("theme") as RawThemeType | undefined;
	if (userTheme && !userTheme.startsWith("s")) {
		setTheme(userTheme as ThemeType);
		return userTheme;
	}

	return prefersTheme();
}

export function getTheme(): ThemeType {
	return getRawTheme().replace("s", "") as ThemeType;
}

export const setTheme = _setTheme;
