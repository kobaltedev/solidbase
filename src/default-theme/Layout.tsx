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
import { Collapsible } from "@kobalte/core/collapsible";
import { Dynamic } from "solid-js/web";
import IconArrowDownLine from "~icons/ri/arrow-down-s-line";
import type {
	DefaultThemeSidebarItem,
	DefaultThemeSidebarItemOptionCustomStatus,
	DefaultThemeSidebarItemOptions,
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
		<Switch>
			<Match
				when={
					"link" in props.item &&
					(props.item as SidebarItemLink & DefaultThemeSidebarItemOptions)
				}
			>
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
								<span>{item().title}</span>
								<Switch>
									<Match when={item().status === "new"}>
										<span class={styles["status-new"]}>New</span>
									</Match>
									<Match when={item().status === "updated"}>
										<span class={styles["status-updated"]}>Updated</span>
									</Match>
									<Match when={item().status === "next"}>
										<span class={styles["status-next"]}>Next</span>
									</Match>
									<Match
										when={
											typeof item().status === "object" &&
											(item()
												.status as DefaultThemeSidebarItemOptionCustomStatus)
										}
									>
										{(status) => (
											<span
												class={styles["status-custom"]}
												style={`---fg: ${status().textColor ?? "white"}; ---bg: ${status().color}`}
											>
												{status().text}
											</span>
										)}
									</Match>
								</Switch>
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
						<Collapsible as="li" defaultOpen={!section().collapsed}>
							<Collapsible.Trigger
								class={styles["section-trigger"]}
								aria-label="Toggle list view"
							>
								<Dynamic component={`h${(props.depth ?? 0) + 2}`}>
									{section().title}
								</Dynamic>
								<IconArrowDownLine />
							</Collapsible.Trigger>

							<Collapsible.Content as="ul" class={styles["section-content"]}>
								<For each={section().items}>
									{(item) => (
										<NavigationItem
											prefix={props.prefix + (section().base ?? "")}
											item={item}
											depth={(props.depth ?? 0) + 1}
										/>
									)}
								</For>
							</Collapsible.Content>
						</Collapsible>
					);
				}}
			</Match>
		</Switch>
	);
}
