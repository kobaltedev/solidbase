import docsearch from "@docsearch/js";
import { onMount } from "solid-js";

import "./DocSearch.css";
import { useRouteConfig } from "../utils";

export default function DocSearch() {
	const config = useRouteConfig();

	onMount(() => {
		const search = config().themeConfig?.search;
		if (!search || search.provider !== "algolia") return;

		docsearch({ ...search.options, container: "#docsearch" });
	});

	return <div id="docsearch" />;
}
