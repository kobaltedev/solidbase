// @refresh reload
import { Dialog } from "@kobalte/core/dialog";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, Match, type ParentProps, Show, Switch } from "solid-js";

import { useLocale, useThemeListener } from "../client";
import {
	type SidebarItemLink,
	type SidebarItemSection,
	SidebarProvider,
	useSidebar,
} from "../client/sidebar";
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
import { Dynamic } from "solid-js/web";
import {
	DefaultThemeConfig,
	type DefaultThemeSidebarItem,
	type DefaultThemeSidebarItemOptions,
} from ".";

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

	const sidebar = useSidebar<DefaultThemeSidebarItemOptions>();

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
	sidebar: { prefix: string; items: DefaultThemeSidebarItem[] };
}

function Navigation(props: NavigationProps) {
	return (
		<nav class={styles["sidenav-links"]}>
			<ul>
				<For each={props.sidebar.items}>
					{(item) => (
						<NavigationItem prefix={props.sidebar.prefix} item={item} />
					)}
				</For>
			</ul>
		</nav>
	);
}

interface NavigationItemProps {
	prefix: string;
	item: DefaultThemeSidebarItem;
	depth?: number;
}

function NavigationItem(props: NavigationItemProps) {
	const locale = useLocale();

	const { setSidebarOpen } = useDefaultThemeState();

	return (
		<li>
			<Switch>
				<Match when={"link" in props.item && (props.item as SidebarItemLink)}>
					{(item) => {
						const link = () => item().link;
						const prefix = () => props.prefix;

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
									{item().title}
								</A>
							</li>
						);
					}}
				</Match>

				<Match
					when={
						"items" in props.item &&
						(props.item as SidebarItemSection<DefaultThemeSidebarItemOptions>)
					}
				>
					{(section) => {
						return (
							<li>
								<Dynamic component={`h${(props.depth ?? 0) + 2}`}>
									{section().title}
								</Dynamic>
								<ul>
									<For each={section().items}>
										{(item) => (
											<NavigationItem
												prefix={props.prefix + (section().base ?? "")}
												item={item}
												depth={(props.depth ?? 0) + 1}
											/>
										)}
									</For>
								</ul>
							</li>
						);
					}}
				</Match>
			</Switch>
		</li>
	);
}
