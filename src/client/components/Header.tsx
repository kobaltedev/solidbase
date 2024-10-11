import type { ParentProps } from "solid-js";
import styles from "./Header.module.css";

import { solidBaseConfig } from "virtual:solidbase";

export default function Header(props: ParentProps<{}>) {
	return (
		<header class={styles.main}>
			<a href="/">{solidBaseConfig.title ?? "SolidBase"}</a>
			{props.children}
		</header>
	);
}
