import { Dialog } from "@kobalte/core/dialog";
import { useMatch } from "@solidjs/router";
import { For, Show, createSignal, lazy } from "solid-js";

import { getLocaleLink, useLocale } from "../../client/locale";
import { useDefaultThemeState, useDefaultThemeComponents } from "../context";
import { useRouteConfig } from "../utils";
import { ArrowDownIcon, MenuLeftIcon } from "./icons";

import styles from "./Header.module.css";

const DocSearch = lazy(() => import("./DocSearch"));

export default function Header() {
	const [tocRef, setTocRef] = createSignal<HTMLElement>();

	const { ThemeSelector, LocaleSelector, TableOfContents } =
		useDefaultThemeComponents();

	const { tocOpen, setTocOpen, setSidebarOpen, frontmatter } = useDefaultThemeState();

	const config = useRouteConfig();
	const locale = useLocale()

	return (
		<Dialog open={tocOpen()} onOpenChange={setTocOpen} modal={false}>
			<header class={styles.header}>
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
						frontmatter()?.sidebar !== false ||
						frontmatter()?.toc !== false
					}
				>
					<div class={styles["mobile-bar"]}>
						<Show
							when={frontmatter()?.sidebar !== false}
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
						<Show when={frontmatter()?.toc !== false}>
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
