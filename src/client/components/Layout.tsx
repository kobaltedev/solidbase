import { Title } from "@solidjs/meta";

import type { ParentProps } from "solid-js";
import { useSolidBaseContext } from "../context";
import { CurrentPageDataContext, useCurrentPageData } from "../page-data";

export default function Layout(props: ParentProps) {
	const { Header, TableOfContent } = useSolidBaseContext().components;

	const pageData = useCurrentPageData();

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

				<Header>{JSON.stringify(pageData())}</Header>
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
						style={{ "max-width": "52rem", width: "100%" }}
					>
						{props.children}
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
