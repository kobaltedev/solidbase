import { createMediaQuery } from "@solid-primitives/media";
import { createEffect, createSignal, on } from "solid-js";

const [_mobileLayout, setMobileLayout] = createSignal(false);
const query = createMediaQuery("(max-width: 1100px)");

createEffect(on(query, setMobileLayout, { defer: true }));

setTimeout(() => setMobileLayout(query()));

export const mobileLayout = _mobileLayout;
