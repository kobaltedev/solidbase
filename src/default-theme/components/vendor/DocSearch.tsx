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
				//@ts-expect-error: docsearch not callable?
				docsearch({
					container: el,
					...props.docsearch,
				});
			} catch {}
		},
	);

	return <div ref={setRef} class={styles.docsearch} />;
}
