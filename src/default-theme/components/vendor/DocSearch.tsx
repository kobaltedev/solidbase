import docsearch, { type DocSearchProps } from "@docsearch/js";
import { createEffect, createSignal } from "solid-js";

import "@docsearch/css/dist/style.css";
import styles from "./DocSearch.module.css";

export default function DocSearch(props: {
	docsearch: Omit<DocSearchProps, "container">;
}) {
	const [ref, setRef] = createSignal<HTMLElement>();

	createEffect(
		() => ({ el: ref(), options: props.docsearch }),
		({ el, options }) => {
			if (!el) return;
			try {
				// DocSearch is callable at runtime; Node16 resolution types its default as a module.
				const instance = (
					docsearch as unknown as (options: DocSearchProps) => {
						destroy(): void;
					}
				)({ container: el, ...options });
				return () => instance.destroy();
			} catch {}
		},
	);

	return <div ref={setRef} class={styles.docsearch} />;
}
