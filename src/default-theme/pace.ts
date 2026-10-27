import { BProgress, type BProgressOptions } from "@bprogress/core";
import { useIsRouting } from "@solidjs/router";
import { createEffect, onCleanup } from "solid-js";
import "@bprogress/core/css";

export function usePace(options?: Partial<BProgressOptions>) {
	const isRouting = useIsRouting();

	BProgress.configure({
		showSpinner: false,
		...options,
	});

	let paceTimeoutId: number | undefined;

	createEffect(
		() => isRouting(),
		(routing) => {
			if (routing) {
				paceTimeoutId = window.setTimeout(() => BProgress.start(), 100);
			} else {
				clearTimeout(paceTimeoutId);
				BProgress.done();
			}
		},
	);

	onCleanup(() => {
		clearTimeout(paceTimeoutId);
	});
}
