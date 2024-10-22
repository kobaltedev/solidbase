import { createMemo } from "solid-js";

import { useSolidBaseContext } from "../context";
import { useCurrentPageData } from "../page-data";
import styles from "./LastUpdated.module.css";

export default function LastUpdated() {
	const pageData = useCurrentPageData();
	const { config } = useSolidBaseContext();

	const formatter = createMemo(
		() => new Intl.DateTimeFormat(undefined, config().lastUpdated || undefined),
	);

	const date = createMemo(() => new Date(pageData().lastUpdated ?? 0));

	return (
		<p class={styles["last-updated"]}>
			Last updated: {formatter().format(date())}
		</p>
	);
}
