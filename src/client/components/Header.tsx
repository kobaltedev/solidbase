import {
	type ParentProps,
	Show,
	createEffect,
	createSignal,
	onMount,
} from "solid-js";
import styles from "./Header.module.css";

import { solidBaseConfig } from "virtual:solidbase";
import { isMobile } from "@solid-primitives/platform";
import { useWindowScrollPosition } from "@solid-primitives/scroll";
import { useSolidBaseContext } from "../context";

const BUFFER_MULT = 3;

export default function Header(props: {}) {
	const [ref, setRef] = createSignal<HTMLElement>();

	const { ThemeSelector } = useSolidBaseContext().components;

	const scroll = useWindowScrollPosition();
	const [offset, setOffset] = createSignal(0);

	let headerHeight = 0;
	onMount(() => {
		headerHeight = ref()!.getBoundingClientRect().height;
	});

	let buffer = true;

	createEffect((prev: number) => {
		if (!isMobile) return 0;
		if (ref()?.getAttribute("data-scrolling-to-header") === "") return scroll.y;

		setOffset((prefOffset) => {
			const delta = scroll.y - prev;

			const newVal = Math.max(
				Math.min(Math.round(prefOffset + delta), headerHeight * BUFFER_MULT),
				0,
			);

			if (newVal >= headerHeight && buffer) {
				buffer = false;
				return headerHeight * BUFFER_MULT;
			}

			if (newVal < headerHeight) buffer = true;

			return newVal;
		});

		return scroll.y;
	}, scroll.y);

	createEffect(() => {
		if (!isMobile) return;
		document.body.style.setProperty(
			"--header-offset",
			`${Math.min(scroll.y, offset(), headerHeight)}px`,
		);
	});

	return (
		<header class={styles.header} ref={setRef}>
			<a href="/" class={styles["logo-link"]}>
				<Show
					when={solidBaseConfig.logo}
					fallback={<span>{solidBaseConfig.title}</span>}
				>
					<img src={solidBaseConfig.logo} alt={solidBaseConfig.title} />
				</Show>
			</a>
			<ThemeSelector />
		</header>
	);
}
