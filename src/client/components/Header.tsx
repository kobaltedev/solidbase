import { solidBaseConfig } from "virtual:solidbase";
import { useWindowScrollPosition } from "@solid-primitives/scroll";
import {
	type Setter,
	Show,
	createEffect,
	createSignal,
	lazy,
	onMount,
} from "solid-js";

import { createEventListener } from "@solid-primitives/event-listener";
import { useSolidBaseContext } from "../context";
import { mobileLayout } from "../globals";
import styles from "./Header.module.css";
import { MenuIcon } from "./icons";

const DocSearch = lazy(() => import("./DocSearch"));

const BUFFER_MULT = 3;

interface HeaderProps {
	setSidebarOpen: Setter<boolean>;
}

export default function Header(props: HeaderProps) {
	const [ref, setRef] = createSignal<HTMLElement>();

	const { ThemeSelector, LocaleSelector } = useSolidBaseContext().components;

	const scroll = useWindowScrollPosition();
	const [offset, setOffset] = createSignal(0);

	let headerHeight = 0;
	onMount(() => {
		headerHeight = ref()!.getBoundingClientRect().height;
		createEventListener(
			window,
			"resize",
			() => (headerHeight = ref()!.getBoundingClientRect().height),
		);
	});

	let buffer = true;

	createEffect((prev: number) => {
		if (!mobileLayout()) return 0;
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
		if (!mobileLayout()) {
			document.body.style.removeProperty("--header-offset");
			setOffset(0);
			return;
		}
		document.body.style.setProperty(
			"--header-offset",
			`${Math.min(scroll.y, offset(), headerHeight)}px`,
		);
	});

	return (
		<header class={styles.header} ref={setRef}>
			<div>
				<a href="/" class={styles["logo-link"]}>
					<Show
						when={solidBaseConfig.logo}
						fallback={<span>{solidBaseConfig.title}</span>}
					>
						<img src={solidBaseConfig.logo} alt={solidBaseConfig.title} />
					</Show>
				</a>
				<div class={styles.selectors}>
					{solidBaseConfig.search?.provider === "algolia" && <DocSearch />}
					<LocaleSelector />
					<ThemeSelector />
				</div>
			</div>
			<div class={styles["mobile-bar"]}>
				<button
					type="button"
					class={styles["mobile-menu"]}
					onClick={() => props.setSidebarOpen((p) => !p)}
					aria-label="Open navigation"
				>
					<MenuIcon />
				</button>
				<button
					type="button"
					class={styles["mobile-menu"]}
					onClick={() => props.setSidebarOpen((p) => !p)}
					aria-label="Open navigation"
				>
					<MenuIcon />
				</button>
			</div>
		</header>
	);
}
