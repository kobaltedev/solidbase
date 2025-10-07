import { useHead } from "@solidjs/meta";
import { createEffect, createSignal, createUniqueId, onMount } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import readPreferredLanguageCookieScript from "./read-preferred-language-cookie.js?raw";

type SupportedLanguage = "ts" | "js";

const COOKIE_NAME = "preferred-language";
const DEFAULT_LANGUAGE = "ts";

function getCookie(cookieString: string): SupportedLanguage {
	if (!cookieString) {
		return DEFAULT_LANGUAGE;
	}

	const match = cookieString.match(
		new RegExp(`\\W?${COOKIE_NAME}=(?<value>\\w+)`),
	);

	if (match?.groups?.value === undefined) {
		return DEFAULT_LANGUAGE;
	}

	return match.groups.value as SupportedLanguage;
}

function getPreferredLanguageCookie(): SupportedLanguage {
	if (isServer) {
		const e = getRequestEvent()!;
		const cookieString = e.request.headers.get("cookie");
		return cookieString ? getCookie(cookieString) : DEFAULT_LANGUAGE;
	}

	return getCookie(document.cookie);
}

const [preferredLanguage, setPreferredLanguage] =
	createSignal<SupportedLanguage>(DEFAULT_LANGUAGE);

export function usePreferredLanguage() {
	onMount(() => {
		setPreferredLanguage(getPreferredLanguageCookie());
	});

	createEffect(() => {
		const preferredLanguageStr = String(preferredLanguage());
		document.documentElement.setAttribute(
			"data-preferred-language",
			preferredLanguageStr,
		);
		document.cookie = `${COOKIE_NAME}=${preferredLanguageStr}; max-age=31536000; path=/`;

		const toggles = document.querySelectorAll<HTMLInputElement>(
			'input[type="checkbox"].sb-ts-js-toggle',
		);

		for (const toggle of Array.from(toggles)) {
			toggle.checked = preferredLanguage() === "ts";
		}
	});

	useHead({
		tag: "script",
		id: createUniqueId(),
		props: { children: readPreferredLanguageCookieScript },
		setting: { close: true },
	});

	return [preferredLanguage, setPreferredLanguage] as const;
}
