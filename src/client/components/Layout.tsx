import { Dialog } from "@kobalte/core/dialog";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, type ParentProps, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { Sidebar } from "../../config";
import { useSolidBaseContext } from "../context";
import { mobileLayout } from "../globals";
import { CurrentPageDataContext, useCurrentPageData } from "../page-data";
import { useSidebar } from "../sidebar";
import styles from "./Layout.module.css";
import Link from "./Link";
import { CrossIcon } from "./icons";

interface SidebarItem {
	title: string;
	collapsed: boolean;
	items: ({ title: string; link: string } | SidebarItem)[];
}

export default function Layout(props: ParentProps) {
	const {
		config,
		components: { Header, Article },
	} = useSolidBaseContext();

	const pageData = useCurrentPageData();

	const [sidebarOpen, setSidebarOpen] = createSignal(false);

	const sidebar = useSidebar();

	return (
		<CurrentPageDataContext.Provider value={pageData}>
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

			<Show
				when={pageData().frontmatter?.title}
				fallback={<Title>{config().title}</Title>}
			>
				<Title>
					{(config().titleTemplate ?? ":title").replace(
						":title",
						pageData().frontmatter?.title,
					)}
				</Title>
			</Show>

			<div class={styles.layout}>
				<Header setSidebarOpen={setSidebarOpen} />

				<Show
					when={sidebar() && sidebar()!.items?.length > 0}
					fallback={<div />}
				>
					<Dialog
						open={!mobileLayout() || sidebarOpen()}
						onOpenChange={setSidebarOpen}
						modal={mobileLayout()}
					>
						<Dynamic
							component={
								mobileLayout()
									? Dialog.Portal
									: (props: ParentProps) => props.children
							}
						>
							<Show when={mobileLayout()}>
								<Dialog.Overlay class={styles["sidenav-overlay"]} />
							</Show>
							<Dialog.Content as="aside" class={styles.sidenav}>
								<div class={styles["sidenav-content"]}>
									<Show when={mobileLayout()}>
										<div class={styles["sidenav-header"]}>
											<a href="/" class={styles["logo-link"]}>
												<Show
													when={config().logo}
													fallback={<span>{config().title}</span>}
												>
													<img src={config().logo} alt={config().title} />
												</Show>
											</a>
											<Show when={mobileLayout()}>
												<Dialog.CloseButton class={styles["sidenav-close-btn"]}>
													<CrossIcon />
												</Dialog.CloseButton>
											</Show>
										</div>
									</Show>
									<Navigation sidebar={sidebar()!} />
								</div>
							</Dialog.Content>
						</Dynamic>
					</Dialog>
				</Show>

				<main id="main-content">
					<Article>{props.children}</Article>
				</main>
			</div>
		</CurrentPageDataContext.Provider>
	);
}

interface NavigationProps {
	sidebar: Sidebar;
}
const Navigation = (props: NavigationProps) => {
	const { locale } = useSolidBaseContext();

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
													(item as { link: string }).link,
												)}
												end
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
