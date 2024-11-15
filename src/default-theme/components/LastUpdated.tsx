import { Show, createMemo } from "solid-js";

import { useCurrentPageData } from "../../client/page-data";
import { useRouteConfig } from "../utils";
import styles from "./LastUpdated.module.css";

export default function LastUpdated() {
	const pageData = useCurrentPageData();
	const config = useRouteConfig();

	const formatter = createMemo(
		() =>
			new Intl.DateTimeFormat(undefined, config()?.lastUpdated || undefined),
	);

	const date = createMemo(
		() =>
			new Date(
				Number.isNaN(pageData().lastUpdated)
					? 0
					: (pageData().lastUpdated ?? 0),
			),
	);

	return (
		<p class={styles["last-updated"]}>
			Last updated:{" "}
			<Show when={!Number.isNaN(pageData().lastUpdated)} fallback="?">
				{formatter().format(date())}
			</Show>
		</p>
	);
}
