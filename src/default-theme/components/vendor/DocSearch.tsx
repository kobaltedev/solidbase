import docsearch, { type DocSearchProps } from "@docsearch/js";
import { onMount } from "solid-js";

import "@docsearch/css/dist/style.css";
import styles from "./DocSearch.module.css";

export default function DocSearch(props: {
	docsearch: Omit<DocSearchProps, "container"> & { container?: string };
}) {
	const id = props.docsearch.container ?? "docsearch";

	onMount(() => {
		setTimeout(() => {
			//@ts-expect-error: docsearch not callable?
			docsearch({
				container: `#${id}`,
				...props.docsearch,
			});
		})
	});

	return <div id={id} class={styles.docsearch} />;
}
