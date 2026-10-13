import docsearch, { type DocSearchProps } from "@docsearch/js";
import { createEffect, createSignal } from "solid-js";

import "@docsearch/css/dist/style.css";
import styles from "./DocSearch.module.css";

export default function DocSearch(props: {
	docsearch: Omit<DocSearchProps, "container">;
}) {
	const [ref, setRef] = createSignal<HTMLElement>();

	createEffect(
		() => ref(),
		(el) => {
			if (!el) return;
			try {
				// DocSearch is callable at runtime; Node16 resolution types its default as a module.
				(docsearch as unknown as (options: DocSearchProps) => void)({
					container: el,
					...props.docsearch,
				});
			} catch {}
		},
	);

	return <div ref={setRef} class={styles.docsearch} />;
}
