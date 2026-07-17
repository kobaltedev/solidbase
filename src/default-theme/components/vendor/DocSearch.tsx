import { onMount } from "solid-js";
import docsearch, { DocSearchProps } from '@docsearch/js';

import styles from "./DocSearch.module.css";

const id = "docsearch";

export default function DocSearch(props: {docsearch: Omit<DocSearchProps, "container"> & {container?: string}}) {
	onMount(() => {
		//@ts-expect-error: docsearch not callable?
		docsearch({
			container: `#${id}`,
			...props.docsearch,
		});
	})

	return <div id={id} class={styles.docsearch} />;
}
