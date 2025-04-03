import { createMediaQuery } from "@solid-primitives/media";
import { createEffect, createRoot, createSignal, on, onMount } from "solid-js";
import { isServer } from "solid-js/web";

const [_mobileLayout, setMobileLayout] = createSignal(false);

if (isServer) {
	const query = createMediaQuery("(max-width: 1100px)");

	createRoot(() => {
		createEffect(on(query, (q) => setMobileLayout(q), { defer: true }));
	});

	setTimeout(() => setMobileLayout(query()));
}

export const mobileLayout = _mobileLayout;
