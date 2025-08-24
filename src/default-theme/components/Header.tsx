import { Dialog } from "@kobalte/core/dialog";
import { useMatch } from "@solidjs/router";
import { For, Show, createSignal, lazy } from "solid-js";

import IconArrowDownLine from "~icons/ri/arrow-down-s-line";
import IconCloseFill from "~icons/ri/close-large-fill";
import IconMenuLeftLine from "~icons/ri/menu-2-line";
import IconMenuFill from "~icons/ri/menu-fill";
import {
	getLocaleLink,
	useCurrentPageData,
	useLocale,
} from "../../client/index.jsx";
import {
	useDefaultThemeComponents,
	useDefaultThemeState,
} from "../context.jsx";
import { useRouteConfig } from "../utils.js";

import { useSidebar } from "../../client/sidebar.js";
import styles from "./Header.module.css";

const DocSearch = lazy(() => import("./DocSearch.jsx"));

export default function Header() {
	const [tocRef, setTocRef] = createSignal<HTMLElement>();
	const [navRef, setNavRef] = createSignal<HTMLElement>();

	const { ThemeSelector, LocaleSelector, TableOfContents } =
		useDefaultThemeComponents();

	const {
		tocOpen,
		setTocOpen,
		setSidebarOpen,
		frontmatter,
		navOpen,
		setNavOpen,
	} = useDefaultThemeState();

	const config = useRouteConfig();
	const locale = useLocale();
	const sidebar = useSidebar();
	const tocContent = () => useCurrentPageData()()?.toc;

	const hasSidebar = () =>
		frontmatter()?.sidebar !== false &&
		sidebar() &&
		sidebar()!.items.length > 0;
	const hasToc = () =>
		frontmatter()?.toc !== false && tocContent() && tocContent()!.length > 0;

	return (
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
				<div class={styles["top-nav"]}>
					<Dialog open={navOpen()} onOpenChange={setNavOpen} modal={false}>
						<Dialog.Trigger
							type="button"
							class={styles["mobile-nav-menu"]}
							aria-label="Open navigation"
						>
							<IconMenuFill class={styles["menu-icon"]} />
							<IconCloseFill class={styles["close-icon"]} />
						</Dialog.Trigger>

						<Dialog.Portal mount={navRef()}>
							<Dialog.Content class={styles["nav-popup"]}>
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
														data-matched={
															match() !== undefined ? true : undefined
														}
														onClick={() => setNavOpen(false)}
													>
														{item.text}
													</a>
												);
											}}
										</For>
									)}
								</Show>
								<div class={styles["nav-popup-selectors"]}>
									<LocaleSelector />
									<ThemeSelector />
								</div>
							</Dialog.Content>
						</Dialog.Portal>
					</Dialog>
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

			<div ref={setNavRef} class={styles["nav-container"]} />

			<Show when={hasSidebar() || hasToc()}>
				<div class={styles["mobile-bar"]}>
					<Show when={hasSidebar()} fallback={<div />}>
						<button
							type="button"
							class={styles["mobile-menu"]}
							onClick={() => setSidebarOpen((p) => !p)}
							aria-label="Open navigation"
						>
							<IconMenuLeftLine /> Menu
						</button>
					</Show>

					<Dialog open={tocOpen()} onOpenChange={setTocOpen} modal={false}>
						<Show when={hasToc()}>
							<Dialog.Trigger
								type="button"
								class={styles["mobile-menu"]}
								aria-label="Open table of contents"
							>
								On this page <IconArrowDownLine />
							</Dialog.Trigger>
						</Show>

						<Dialog.Portal mount={tocRef()}>
							<Dialog.Content
								class={styles["toc-popup"]}
								onClick={() => setTocOpen(false)}
							>
								<TableOfContents />
							</Dialog.Content>
						</Dialog.Portal>
					</Dialog>
				</div>
			</Show>

			<div ref={setTocRef} class={styles["toc-container"]} />
		</header>
	);
}
