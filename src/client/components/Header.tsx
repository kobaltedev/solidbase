import { createEventListener } from "@solid-primitives/event-listener";
import { useMatch } from "@solidjs/router";
import { For, Show, createEffect, createSignal, lazy, onMount } from "solid-js";

import { Dialog } from "@kobalte/core/dialog";
import { useSolidBaseContext } from "../context";
import { mobileLayout } from "../globals";
import { getLocaleLink } from "../locale";
import styles from "./Header.module.css";
import { ArrowDownIcon, MenuLeftIcon } from "./icons";

const DocSearch = lazy(() => import("./DocSearch"));

const BUFFER_MULT = 3;

interface HeaderProps {}

export default function Header(props: HeaderProps) {
	const [ref, setRef] = createSignal<HTMLElement>();
	const [tocRef, setTocRef] = createSignal<HTMLElement>();

	const {
		components: { ThemeSelector, LocaleSelector, TableOfContents },
		setSidebarOpen,
		setTocOpen,
		tocOpen,
	} = useSolidBaseContext();

	const { config, locale } = useSolidBaseContext();

	return (
		<Dialog open={tocOpen()} onOpenChange={setTocOpen} modal={false}>
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
						onClick={() => setSidebarOpen((p) => !p)}
						aria-label="Open navigation"
					>
						<MenuLeftIcon /> Menu
					</button>
					<Dialog.Trigger
						type="button"
						class={styles["mobile-menu"]}
						aria-label="Open table of contents"
					>
						On this page <ArrowDownIcon />
					</Dialog.Trigger>
				</div>

				<div ref={setTocRef} class={styles["toc-container"]} />
			</header>

			<Dialog.Portal mount={tocRef()}>
				<Dialog.Content
					class={styles["toc-popup"]}
					onClick={() => setTocOpen(false)}
				>
					<TableOfContents />
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
}
