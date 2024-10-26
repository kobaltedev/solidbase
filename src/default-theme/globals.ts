import { createMediaQuery } from "@solid-primitives/media";
import { createEffect, createRoot, createSignal, on } from "solid-js";

const [_mobileLayout, setMobileLayout] = createSignal(false);
const query = createMediaQuery("(max-width: 1100px)");

createRoot(() => {
	createEffect(on(query, (q) => setMobileLayout(q), { defer: true }));
});

setTimeout(() => setMobileLayout(query()));

export const mobileLayout = _mobileLayout;
