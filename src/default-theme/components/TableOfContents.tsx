import { useWindowScrollPosition } from "@solid-primitives/scroll";
import { For, type JSX, Show, createEffect, createSignal } from "solid-js";
import {
	type TableOfContentsItemData,
	useCurrentPageData,
} from "../../client/page-data";
import styles from "./TableOfContents.module.css";

export default function TableOfContents(props: {}) {
	const toc = () => useCurrentPageData()().toc;

	const [currentSection, setCurrentSection] = createSignal<
		string | undefined
	>();

	const scroll = useWindowScrollPosition();

	const [headingPositions, setHeadingPositions] = createSignal<
		Array<{ url: string; top: number | undefined }>
	>([]);

	createEffect(() => {
		const t = toc();
		if (!t) return [];
		setHeadingPositions(
			t.flatMap(flattenData).map((href) => {
				const el = document.getElementById(href.slice(1));

				if (!el) {
					return {
						url: href,
						top: undefined,
					};
				}

				const style = window.getComputedStyle(el);
				const scrollMt = Number.parseFloat(style.scrollMarginTop) + 1;

				const top =
					window.scrollY + el.getBoundingClientRect().top - scrollMt - 50;

				return {
					url: href,
					top,
				};
			}),
		);
	});

	createEffect(() => {
		const top = scroll.y;
		let current = headingPositions()[0]?.url;

		for (const heading of headingPositions()) {
			if (!heading.top) continue;

			if (top >= heading.top) {
				current = heading.url;
			} else {
				break;
			}
		}

		setCurrentSection(current);
	});

	return (
		<Show when={toc()}>
			{(toc) => (
				<nav class={styles.toc}>
					<span>On This Page</span>
					<ol>
						<For each={toc()}>
							{(toc) => (
								<TableOfContentsItem data={toc} current={currentSection()} />
							)}
						</For>
					</ol>
				</nav>
			)}
		</Show>
	);
}

function TableOfContentsItem(props: {
	data: TableOfContentsItemData;
	current: string | undefined;
}) {
	const [ref, setRef] = createSignal<HTMLElement>();

	const handleClick: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent> = (
		event,
	) => {
		const header = document.querySelector("header") as HTMLElement | undefined;
		header?.setAttribute("data-scrolling-to-header", "");
		document
			.getElementById(
				(event.target as HTMLAnchorElement).getAttribute("href")!.slice(1),
			)
			?.scrollIntoView(true);
	};

	createEffect(() => {
		const header = document.querySelector("header") as HTMLElement | undefined;
		header?.setAttribute("data-scrolling-to-header", "");
		if (props.data.href === props.current && !elementInViewport(ref()!)) {
			ref()?.scrollIntoView({ behavior: "smooth" });
		}
		setTimeout(() => header?.removeAttribute("data-scrolling-to-header"));
	});

	return (
		<li class={styles.item}>
			<a
				ref={setRef}
				onClick={handleClick}
				href={props.data.href}
				class={props.data.href === props.current ? styles.active : undefined}
			>
				{props.data.title}
			</a>
			<Show when={props.data.children && props.data.children.length > 0}>
				<ol>
					<For each={props.data.children}>
						{(nested) => (
							<TableOfContentsItem data={nested} current={props.current} />
						)}
					</For>
				</ol>
			</Show>
		</li>
	);
}

function flattenData(data: TableOfContentsItemData): Array<string> {
	return [data?.href, ...(data?.children ?? []).flatMap(flattenData)].filter(
		Boolean,
	);
}

function elementInViewport(el: HTMLElement) {
	const rect = el.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <=
			(window.innerHeight ||
				document.documentElement.clientHeight) /* or $(window).height() */ &&
		rect.right <=
			(window.innerWidth ||
				document.documentElement.clientWidth) /* or $(window).width() */
	);
}
