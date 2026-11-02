import { BProgress, type BProgressOptions } from "@bprogress/core";
import { useIsRouting } from "@solidjs/router";
import { createEffect } from "solid-js";
import "@bprogress/core/css";

export function usePace(options?: Partial<BProgressOptions>) {
	const isRouting = useIsRouting();

	BProgress.configure({
		showSpinner: false,
		...options,
	});

	let paceTimeoutId: number | undefined;

	const dispose = () => {
		clearTimeout(paceTimeoutId);
		BProgress.done();
	};

	createEffect(
		() => isRouting(),
		(routing) => {
			if (routing) {
				paceTimeoutId = window.setTimeout(() => BProgress.start(), 100);
			} else {
				dispose();
			}

			return dispose;
		},
	);
}
