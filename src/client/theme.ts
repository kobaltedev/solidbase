import { usePrefersDark } from "@solid-primitives/media";
import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { getCookie as getServerCookie } from "vinxi/server";

export type ThemeType = "light" | "dark";

function getClientCookie(name: string) {
	if (!name || !document.cookie) return undefined;
	const match = document.cookie.match(
		new RegExp(`\\\\W?${name}=(?<value>\\\\w+)`),
	);
	return match?.groups?.value || undefined;
}

function getServerTheme() {
	"use server";

	return (getServerCookie("theme") ?? "light") as ThemeType;
}

const [theme, _setTheme] = createSignal<ThemeType>();

export function getTheme(): ThemeType {
	if (isServer) return getServerTheme();

	if (theme()) return theme()!;

	const prefersDark = usePrefersDark();
	const prefersTheme = () => (prefersDark() ? "dark" : "light");

	const userTheme = getClientCookie("theme") as ThemeType | undefined;
	if (userTheme) setTheme(userTheme);

	return userTheme ?? prefersTheme();
}

export const setTheme = _setTheme;
