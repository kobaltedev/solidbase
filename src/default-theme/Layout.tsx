import { Dialog } from "@kobalte/core/dialog";
import { A, type RouteSectionProps } from "@solidjs/router";
import { For, Show } from "solid-js";

import {
	DefaultThemeContextProvider,
	useDefaultThemeContext,
	useThemeComponents,
} from "./context";
import { mobileLayout } from "./globals";
import { useSidebar } from "./sidebar";
import { useRouteConfig, useSolidBaseContext } from "./utils";

import "./index.css";
import type { Sidebar } from ".";
import styles from "./Layout.module.css";
// font css is imported by theme vite plugin

export default (props: RouteSectionProps) => (
	<DefaultThemeContextProvider>
		<Layout {...props} />
	</DefaultThemeContextProvider>
);

function Layout(props: RouteSectionProps) {
	const { Header, Article, Link } = useThemeComponents();
	const { sidebarOpen, setSidebarOpen } = useDefaultThemeContext();
	const config = useRouteConfig();

	const sidebar = useSidebar();

	return (
		<>
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
					when={sidebar() && sidebar()!.items?.length > 0}
					fallback={<div />}
				>
					<Show
						when={mobileLayout()}
						fallback={
							<aside class={styles.sidenav}>
								<div class={styles["sidenav-content"]}>
									<Navigation sidebar={sidebar()!} />
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
										<Navigation sidebar={sidebar()!} />
									</div>
								</Dialog.Content>
							</Dialog.Portal>
						</Dialog>
					</Show>
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
const Navigation = (props: NavigationProps) => {
	const { locale } = useSolidBaseContext();
	const { setSidebarOpen } = useDefaultThemeContext();

	return (
		<nav class={styles["sidenav-links"]}>
			<ul>
				<For each={props.sidebar.items}>
					{(section) => (
						<li>
							<h2>{section.title}</h2>
							<ul>
								<For each={section.items}>
									{(item) => (
										<li>
											<A
												class={`${styles["sidenav-link"]}`}
												activeClass={styles.active}
												href={locale.applyPathPrefix(
													`${props.sidebar.prefix}${(item as { link: string }).link}`,
												)}
												end
												onClick={() => setSidebarOpen(false)}
											>
												{item.title}
											</A>
										</li>
									)}
								</For>
							</ul>
						</li>
					)}
				</For>
			</ul>
		</nav>
	);
};
