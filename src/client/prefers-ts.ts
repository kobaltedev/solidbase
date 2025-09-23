import { useHead } from "@solidjs/meta";
import { createEffect, createSignal, createUniqueId, onMount } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import readPrefersTsCookieScript from "./read-prefers-ts-cookie.js?raw";

const COOKIE_NAME = "prefers-ts";
const DEFAULT_ENABLED = true;

function getCookie(cookieString: string): boolean {
	if (!cookieString) {
		return DEFAULT_ENABLED;
	}

	const match = cookieString.match(
		new RegExp(`\\W?${COOKIE_NAME}=(?<value>\\w+)`),
	);

	if (match?.groups?.value === undefined) {
		return DEFAULT_ENABLED;
	}

	return match?.groups?.value === "true";
}

function getPrefersTsCookie(): boolean {
	if (isServer) {
		const e = getRequestEvent()!;
		const cookieString = e.request.headers.get("cookie");
		return cookieString ? getCookie(cookieString) : DEFAULT_ENABLED;
	}

	return getCookie(document.cookie);
}

const [prefersTs, setPrefersTs] = createSignal(DEFAULT_ENABLED);

export function usePrefersTs() {
	onMount(() => {
		setPrefersTs(getPrefersTsCookie());
	});

	createEffect(() => {
		const prefersTsStr = String(prefersTs());
		document.documentElement.setAttribute("data-prefers-ts", prefersTsStr);
		document.cookie = `${COOKIE_NAME}=${prefersTsStr}; max-age=31536000; path=/`;

		const toggles = document.querySelectorAll<HTMLInputElement>(
			'input[type="checkbox"].sb-ts-toggle',
		);

		for (const toggle of toggles) {
			toggle.checked = prefersTs();
		}
	});

	useHead({
		tag: "script",
		id: createUniqueId(),
		props: { children: readPrefersTsCookieScript },
		setting: { close: true },
	});

	return [prefersTs, setPrefersTs] as const;
}
