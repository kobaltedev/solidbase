import {
	type ParentProps,
	createEffect,
	createSignal,
	onMount,
} from "solid-js";
import styles from "./Header.module.css";

import { solidBaseConfig } from "virtual:solidbase";
import { useWindowScrollPosition } from "@solid-primitives/scroll";
import createTween from "@solid-primitives/tween";

const BUFFER_MULT = 3;

export default function Header(props: ParentProps<{}>) {
	const [ref, setRef] = createSignal<HTMLElement>();

	const scroll = useWindowScrollPosition();
	const [offset, setOffset] = createSignal(0);

	let headerHeight = 0;
	onMount(() => {
		headerHeight = ref()!.getBoundingClientRect().height;
	});

	const smoothOffset = createTween(() => Math.min(offset(), headerHeight), {
		duration: 250,
	});

	let buffer = true;

	createEffect((prev: number) => {
		setOffset((prefOffset) => {
			let delta = scroll.y - prev;
			if (delta < 0) delta /= 2;

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
		document.body.style.setProperty(
			"--header-offset",
			`${Math.min(scroll.y, smoothOffset())}px`,
		);
	});

	return (
		<header class={styles.header} ref={setRef}>
			<a href="/">{solidBaseConfig.title}</a>
			{props.children}
		</header>
	);
}
