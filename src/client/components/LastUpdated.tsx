import { useCurrentPageData } from "../page-data";
import styles from "./LastUpdated.module.css";

import { solidBaseConfig } from "virtual:solidbase";
import { createMemo } from "solid-js";

export default function LastUpdated() {
	const pageData = useCurrentPageData();

	const formatter = new Intl.DateTimeFormat(
		undefined,
		solidBaseConfig.lastUpdated || undefined,
	);

	const date = createMemo(() => new Date(pageData().lastUpdated ?? 0));

	return (
		<p class={styles["last-updated"]}>
			Last updated: {formatter.format(date())}
		</p>
	);
}
