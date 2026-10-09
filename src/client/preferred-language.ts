import { Script } from "@solidjs/meta";
import { getRequestEvent, isServer } from "@solidjs/web";
import {
	createComponent,
	createEffect,
	createSignal,
	onSettled,
} from "solid-js";
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
	onSettled(() => {
		setPreferredLanguage(getPreferredLanguageCookie());
	});

	createEffect(
		() => preferredLanguage(),
		(lang) => {
			const preferredLanguageStr = String(lang);
			document.documentElement.setAttribute(
				"data-preferred-language",
				preferredLanguageStr,
			);
			// biome-ignore lint/suspicious/noDocumentCookie: remove next major
			document.cookie = `${COOKIE_NAME}=${preferredLanguageStr}; max-age=31536000; path=/`;

			const toggles = document.querySelectorAll<HTMLInputElement>(
				'input[type="checkbox"].sb-ts-js-toggle',
			);

			for (const toggle of Array.from(toggles)) {
				toggle.checked = lang === "ts";
			}
		},
	);

	return [preferredLanguage, setPreferredLanguage] as const;
}

/** Inline script that applies the preferred-language cookie before hydration (prevents FOUC). Render once in the document head. */
export function PreferredLanguageCookieScript() {
	return createComponent(Script, {
		id: "sb-preferred-language-script",
		children: readPreferredLanguageCookieScript,
	});
}
