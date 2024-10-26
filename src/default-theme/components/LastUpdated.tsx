import { createMemo } from "solid-js";

import styles from "./LastUpdated.module.css";
import { useCurrentPageData } from "../../client/page-data";
import { useRouteConfig } from "../utils";

export default function LastUpdated() {
  const pageData = useCurrentPageData();
  const config = useRouteConfig();

  const formatter = createMemo(
    () =>
      new Intl.DateTimeFormat(undefined, config()?.lastUpdated || undefined),
  );

  const date = createMemo(() => new Date(pageData().lastUpdated ?? 0));

  return (
    <p class={styles["last-updated"]}>
      Last updated: {formatter().format(date())}
    </p>
  );
}
