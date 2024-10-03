import { For, Show } from "solid-js";
import { type TableOfContentData, useCurrentPageData } from "../page-data";

export default function TableOfContent(props: {}) {
	const toc = () => useCurrentPageData()().toc;

	return (
		<Show when={toc()}>
			<nav
				style={{
					"border-left": "1px solid gray",
					"padding-left": "1rem",
				}}
			>
				<span style={{ "line-height": "2rem" }}>On This Page</span>
				<ul
					style={{
						display: "flex",
						"flex-direction": "column",
						padding: 0,
					}}
				>
					<TableOfContentItem data={toc()!} />
				</ul>
			</nav>
		</Show>
	);
}

function TableOfContentItem(props: { data: TableOfContentData }) {
	return (
		<li style={{ "list-style": "none" }}>
			<a href={props.data.url}>{props.data.title}</a>
			<Show when={props.data.children && props.data.children.length > 0}>
				<ol style={{ "padding-left": "1rem" }}>
					<For each={props.data.children}>
						{(nested) => <TableOfContentItem data={nested} />}
					</For>
				</ol>
			</Show>
		</li>
	);
}
