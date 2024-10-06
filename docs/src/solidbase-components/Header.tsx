import styles from "@kobalte/solidbase/client/components/Header.module.css";
import type { ParentProps } from "solid-js";

interface HeaderProps {
	appName?: string;
}

export default function Header(props: ParentProps<HeaderProps>) {
	return (
		<header class={styles.main} style={{ "border-bottom": "1px solid gray" }}>
			<div class={styles.logo_container}>
				<a class={styles.logo_link} href="/">
					{props.appName ?? "SolidBase"}
				</a>
				{/* <span class="rounded bg-zinc-100 px-1.5 py-1 text-sm leading-none dark:bg-zinc-800 dark:text-zinc-300"> */}
				{/* 	{LATEST_CORE_VERSION_NAME} */}
				{/* </span> */}
			</div>

			<p>Override</p>
			{props.children}
		</header>
	);
}
