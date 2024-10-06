import type { ParentProps } from "solid-js";
import styles from "./Header.module.css";

export default function Header(props: ParentProps<{}>) {
	return (
		<header class={styles.main}>
			<p>Internal</p>
			{props.children}
		</header>
	);
}
