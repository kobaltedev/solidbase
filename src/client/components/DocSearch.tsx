import { solidBaseConfig } from "virtual:solidbase";
import docsearch from "@docsearch/js";
import { onMount } from "solid-js";
import "./DocSearch.css";

export default function DocSearch() {
	onMount(() => {
		const search = solidBaseConfig.search;
		if (!search || search.provider !== "algolia") return;

		docsearch({ ...search.options, container: "#docsearch" });
	});

	return <div id="docsearch" />;
}
