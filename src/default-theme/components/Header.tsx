import { Dialog } from "@kobalte/core/dialog";
import { useMatch } from "@solidjs/router";
import { For, Show, createSignal, lazy } from "solid-js";

import type { DefaultThemeConfig } from "..";
import { getLocaleLink } from "../../client/locale";
import { useCurrentPageData } from "../../client/page-data";
import { useDefaultThemeContext, useThemeComponents } from "../context";
import { useRouteConfig, useSolidBaseContext } from "../utils";
import styles from "./Header.module.css";
import { ArrowDownIcon, MenuLeftIcon } from "./icons";

const DocSearch = lazy(() => import("./DocSearch"));

const BUFFER_MULT = 3;

export default function Header() {
	const [ref, setRef] = createSignal<HTMLElement>();
	const [tocRef, setTocRef] = createSignal<HTMLElement>();

	const { ThemeSelector, LocaleSelector, TableOfContents } =
		useThemeComponents();

	const { tocOpen, setTocOpen, setSidebarOpen } = useDefaultThemeContext();
	const pageData = useCurrentPageData();

	const config = useRouteConfig();
	const { locale } = useSolidBaseContext();

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
						{config().themeConfig?.search?.provider === "algolia" && (
							<DocSearch />
						)}
						<Show when={config().themeConfig?.nav}>
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
				<Show
					when={
						pageData().layout?.sidebar !== false ||
						pageData().layout?.toc !== false
					}
				>
					<div class={styles["mobile-bar"]}>
						<Show
							when={pageData().layout?.sidebar !== false}
							fallback={<div />}
						>
							<button
								type="button"
								class={styles["mobile-menu"]}
								onClick={() => setSidebarOpen((p) => !p)}
								aria-label="Open navigation"
							>
								<MenuLeftIcon /> Menu
							</button>
						</Show>
						<Show when={pageData().layout?.toc !== false}>
							<Dialog.Trigger
								type="button"
								class={styles["mobile-menu"]}
								aria-label="Open table of contents"
							>
								On this page <ArrowDownIcon />
							</Dialog.Trigger>
						</Show>
					</div>
				</Show>

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
