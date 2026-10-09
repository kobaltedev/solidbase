import { createMediaQuery } from "@solid-primitives/media";
import { isServer } from "@solidjs/web";
import { createEffect, createRoot, createSignal } from "solid-js";

const [_mobileLayout, setMobileLayout] = createSignal(false);

// Module-level singleton. A root created at module scope has no parent owner, so it is
// never disposed with a component; creating it inside `onMount` (per component instance)
// leaked one computation per Layout and broke hydration (kobaltedev/solidbase#152).
// The initial value is applied after hydration so server and client agree on first render.
if (!isServer) {
	createRoot(() => {
		const query = createMediaQuery("(max-width: 1100px)");
		createEffect(
			() => query(),
			(q) => {
				setMobileLayout(q);
			},
			{ defer: true },
		);
		setTimeout(() => setMobileLayout(query()));
	});
}

export const mobileLayout = _mobileLayout;
