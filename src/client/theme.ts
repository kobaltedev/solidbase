import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { getCookie as getServerCookie } from "vinxi/server";

type ThemeType = "light" | "dark" | undefined;

function getClientCookie(name: string) {
	if (!name || !document.cookie) return undefined;
	const match = document.cookie.match(
		new RegExp(`\\\\W?${name}=(?<value>\\\\w+)`),
	);
	return match?.groups?.value || undefined;
}

function getServerTheme() {
	"use server";

	return getServerCookie("theme") as ThemeType;
}

const [theme, _setTheme] = createSignal<ThemeType>();

export function getTheme(): ThemeType {
	if (isServer) return getServerTheme();

	const userTheme = getClientCookie("theme");
	if (userTheme) setTheme(userTheme as ThemeType);
	setTheme(
		window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light",
	);

	return theme();
}

export const setTheme = _setTheme;
