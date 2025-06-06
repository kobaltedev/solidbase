// @refresh reload
import { Dialog } from "@kobalte/core/dialog";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, type ParentProps, Show } from "solid-js";

import { useLocale, useThemeListener } from "../client";
import { SidebarProvider, useSidebar } from "../client/sidebar";
import type { Sidebar, SidebarLink } from "../config/sidebar";
import {
	DefaultThemeComponentsProvider,
	DefaultThemeStateProvider,
	useDefaultThemeComponents,
	useDefaultThemeState,
} from "./context";
import { mobileLayout } from "./globals";
import { usePace } from "./pace";
import { useRouteConfig } from "./utils";

import "virtual:solidbase/default-theme/fonts.css";
import styles from "./Layout.module.css";
import "./index.css";

export default (props: ParentProps) => {
	const config = useRouteConfig();

	return (
		<DefaultThemeStateProvider>
			<DefaultThemeComponentsProvider>
				<SidebarProvider config={config().themeConfig?.sidebar}>
					<Layout>{props.children}</Layout>
				</SidebarProvider>
			</DefaultThemeComponentsProvider>
		</DefaultThemeStateProvider>
	);
};

function Layout(props: ParentProps) {
	const { Header, Article, Link } = useDefaultThemeComponents();
	const { sidebarOpen, setSidebarOpen, frontmatter } = useDefaultThemeState();
	const config = useRouteConfig();

	const sidebar = useSidebar();

	useThemeListener();
	usePace();

	return (
		<>
			<Title>{config().title}</Title>

			<div class={styles.skipnav}>
				<Link
					href="#main-content"
					onClick={() => {
						(
							document
								.getElementById("main-content")
								?.querySelector(
									"button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
								) as HTMLElement | undefined
						)?.focus();
					}}
				>
					Skip to main content
				</Link>
			</div>

			<div class={styles.layout}>
				<Header />

				<Show
					when={(() => {
						const s = sidebar();
						if (!s || s.items.length <= 0 || frontmatter()?.sidebar === false)
							return;
						return s;
					})()}
					fallback={<div class="_e" />}
				>
					{(sidebar) => (
						<Show
							when={mobileLayout()}
							fallback={
								<aside class={styles.sidenav}>
									<div class={styles["sidenav-content"]}>
										<Navigation sidebar={sidebar()} />
									</div>
								</aside>
							}
						>
							<Dialog open={sidebarOpen()} onOpenChange={setSidebarOpen}>
								<Dialog.Portal>
									<Dialog.Overlay class={styles["sidenav-overlay"]} />
									<Dialog.Content class={styles.sidenav}>
										<div class={styles["sidenav-content"]}>
											<div class={styles["sidenav-header"]}>
												<a href="/" class={styles["logo-link"]}>
													<Show
														when={config().logo}
														fallback={<span>{config().title}</span>}
													>
														<img src={config().logo} alt={config().title} />
													</Show>
												</a>
											</div>
											<Navigation sidebar={sidebar()} />
										</div>
									</Dialog.Content>
								</Dialog.Portal>
							</Dialog>
						</Show>
					)}
				</Show>

				<main id="main-content">
					<Article>{props.children}</Article>
				</main>
			</div>
		</>
	);
}

interface NavigationProps {
	sidebar: Sidebar & { prefix: string };
}

function Navigation(props: NavigationProps) {
	const locale = useLocale();

	const { setSidebarOpen } = useDefaultThemeState();

	return (
		<nav class={styles["sidenav-links"]}>
			<ul>
				<For each={props.sidebar.items}>
					{(section) => (
						<li>
							<h2>{section.title}</h2>
							<ul>
								<For each={section.items}>
									{(item) => {
										const link = () => (item as SidebarLink).link;
										const prefix = () => props.sidebar.prefix;

										return (
											<li>
												<A
													class={`${styles["sidenav-link"]}`}
													activeClass={styles.active}
													href={locale.applyPathPrefix(
														`${prefix() === "/" ? "" : prefix()}${link() === "/" ? "" : link()}`,
													)}
													end
													onClick={() => setSidebarOpen(false)}
												>
													{item.title}
												</A>
											</li>
										);
									}}
								</For>
							</ul>
						</li>
					)}
				</For>
			</ul>
		</nav>
	);
}
