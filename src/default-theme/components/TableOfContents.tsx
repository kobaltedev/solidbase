import {
	type Position,
	useWindowScrollPosition,
} from "@solid-primitives/scroll";
import type { JSX } from "@solidjs/web";
import { createEffect, createSignal, For, Show } from "solid-js";
import {
	type TableOfContentsItemData,
	useCurrentPageData,
} from "../../client/index.jsx";
import styles from "./TableOfContents.module.css";

export default function TableOfContents(_props: {}) {
	const toc = () => useCurrentPageData()()?.toc;

	const [currentSection, setCurrentSection] = createSignal<
		string | undefined
	>();

	// @solid-primitives/scroll@next loses the generic on `useWindowScrollPosition` (typed as `unknown`).
	const scroll = useWindowScrollPosition() as Position;

	const [headingPositions, setHeadingPositions] = createSignal<
		Array<{ url: string; top: number | undefined }>
	>([]);

	createEffect(
		() => toc(),
		(t) => {
			if (!t) return;
			setHeadingPositions(
				t.flatMap(flattenData).map((href: string) => {
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
		},
	);

	createEffect(
		() => [scroll.y, headingPositions()] as const,
		([top, positions]) => {
			let current = positions[0]?.url;

			for (const heading of positions) {
				if (!heading.top) continue;

				if (top >= heading.top) {
					current = heading.url;
				} else {
					break;
				}
			}

			setCurrentSection(current);
		},
	);

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

	createEffect(
		() => [props.data.href === props.current, ref()] as const,
		([isCurrent, el]) => {
			const header = document.querySelector("header") as
				| HTMLElement
				| undefined;
			header?.setAttribute("data-scrolling-to-header", "");
			if (isCurrent && el && !elementInViewport(el)) {
				el.scrollIntoView({ behavior: "smooth" });
			}
			setTimeout(() => header?.removeAttribute("data-scrolling-to-header"));
		},
	);

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
