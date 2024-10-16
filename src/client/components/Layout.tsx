import { Title } from "@solidjs/meta";

import { type ParentProps, Show } from "solid-js";
import { useSolidBaseContext } from "../context";
import { CurrentPageDataContext, useCurrentPageData } from "../page-data";
import styles from "./Layout.module.css";
import Link from "./Link";

import { solidBaseConfig } from "virtual:solidbase";

export default function Layout(props: ParentProps) {
	const { Header, Article } = useSolidBaseContext().components;

	const pageData = useCurrentPageData();

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
				fallback={<Title>{solidBaseConfig.title}</Title>}
			>
				<Title>
					{(solidBaseConfig.titleTemplate ?? ":title").replace(
						":title",
						pageData().frontmatter?.title,
					)}
				</Title>
			</Show>

			<div class={styles.layout}>
				<Header />

				<aside
					class={styles.sidenav}
					style={{
						"min-width": "12rem",
						flex: "1",
						display: "flex",
						"flex-direction": "row",
						padding: "1rem",
						"border-right": "1px solid gray",
					}}
				>
					<div style={{ flex: "1" }} />
					<div style={{ "margin-left": "auto", height: "100%" }}>Sidebar</div>
				</aside>

				<main id="main-content">
					<Article>{props.children}</Article>
				</main>
			</div>
		</CurrentPageDataContext.Provider>
	);
}
