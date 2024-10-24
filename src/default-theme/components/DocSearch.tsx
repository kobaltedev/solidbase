import docsearch from "@docsearch/js";
import { onMount } from "solid-js";

import "./DocSearch.css";
import { useRouteConfig } from "../../client/config";
import { DefaultThemeConfig } from "../config";

export default function DocSearch() {
  const config = useRouteConfig<DefaultThemeConfig>();

  onMount(() => {
    const search = config().themeConfig?.search;
    if (!search || search.provider !== "algolia") return;

    docsearch({ ...search.options, container: "#docsearch" });
  });

  return <div id="docsearch" />;
}
