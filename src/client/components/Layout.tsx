import { Title } from "@solidjs/meta";

import { type ParentProps, Show, createEffect, onMount } from "solid-js";
import { useSolidBaseContext } from "../context";
import { CurrentPageDataContext, useCurrentPageData } from "../page-data";
import { getTheme, setTheme } from "../theme";
import styles from "./Layout.module.css";
import Link from "./Link";

export default function Layout(props: ParentProps) {
	const { Header, TableOfContent } = useSolidBaseContext().components;

	const pageData = useCurrentPageData();

	onMount(() => {
		window
			.matchMedia("(prefers-color-scheme: dark)")
			.addEventListener("change", ({ matches }) => {
				const match = matches ? "dark" : "light";
				if (getTheme() !== match) setTheme(match);
			});
	});

	createEffect(() => {
		document.documentElement.setAttribute("data-theme", getTheme() ?? "light");
		document.cookie = `theme=${getTheme()}; max-age=31536000; path=/`;
	});

	return (
		<CurrentPageDataContext.Provider value={pageData}>
			<div
				style={{
					"min-height": "100vh",
					display: "flex",
					"flex-direction": "column",
				}}
			>
				<Title>{pageData().frontmatter?.title ?? ""}</Title>

				<Header />

				<div
					style={{
						"flex-direction": "row",
						display: "flex",
						gap: "2rem",
						flex: 1,
					}}
				>
					<aside
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

					<article
						id="solidbase-doc"
						style={{
							"max-width": "52rem",
							width: "100%",
							"margin-top": "2rem",
						}}
					>
						{props.children}

						<hr />

						<Show when={pageData().editLink}>
							<Link href={pageData().editLink}>Edit this page on GitHub</Link>
						</Show>
					</article>

					<aside
						style={{ "min-width": "12rem", flex: "1", "padding-top": "2rem" }}
					>
						<TableOfContent />
					</aside>
				</div>
			</div>
		</CurrentPageDataContext.Provider>
	);
}
