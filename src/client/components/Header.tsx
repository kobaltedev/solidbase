import { createEventListener } from "@solid-primitives/event-listener";
import { useWindowScrollPosition } from "@solid-primitives/scroll";
import { useMatch } from "@solidjs/router";
import {
	For,
	type Setter,
	Show,
	createEffect,
	createSignal,
	lazy,
	onMount,
} from "solid-js";

import { useSolidBaseContext } from "../context";
import { mobileLayout } from "../globals";
import { getLocaleLink } from "../locale";
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

	const { config, locale } = useSolidBaseContext();

	return (
		<header class={styles.header} ref={setRef}>
			<div>
				<a
					href={getLocaleLink(locale.currentLocale())}
					class={styles["logo-link"]}
				>
					<Show when={config().logo} fallback={<span>{config().title}</span>}>
						<img src={config().logo} alt={config().title} />
					</Show>
				</a>
				<div class={styles.selectors}>
					{config().search?.provider === "algolia" && <DocSearch />}
					<Show when={config().nav}>
						{(nav) => (
							<For each={nav()}>
								{(item) => {
									const match = useMatch(() =>
										locale.applyPathPrefix(
											`${item.activeMatch ?? item.link}/*rest`,
										),
									);

									return (
										<a
											class={styles.navLink}
											href={locale.applyPathPrefix(item.link)}
											data-matched={match() !== undefined ? true : undefined}
										>
											{item.text}
										</a>
									);
								}}
							</For>
						)}
					</Show>
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
					<MenuIcon /> Menu
				</button>
				<button
					type="button"
					class={styles["mobile-menu"]}
					onClick={() => props.setSidebarOpen((p) => !p)}
					aria-label="Open table of contenst"
				>
					On this page
				</button>
			</div>
		</header>
	);
}
