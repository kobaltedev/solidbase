import { WindowEventListener } from "@solid-primitives/event-listener";
import { createShortcut } from "@solid-primitives/keyboard";
import { isAppleDevice } from "@solid-primitives/platform";
import { type ParentProps, Show, createSignal } from "solid-js";

import {
	type RelativePageConfig,
	useCurrentPageData,
} from "../../client/page-data";
import { useThemeComponents } from "../context";
import { mobileLayout } from "../globals";
import { usePrevNext } from "../sidebar";
import { useSolidBaseContext } from "../utils";

import styles from "./Article.module.css";

export default function Article(props: ParentProps) {
	const { config } = useSolidBaseContext();

	const { TableOfContents, Link, LastUpdated, Footer, Hero, Features } =
		useThemeComponents();

	const [contentRef, setContentRef] = createSignal<HTMLElement>();

	const [clickedCodeElement, setClickedCodeElement] =
		createSignal<HTMLElement>();

	const pageData = useCurrentPageData();

	createShortcut(
		[isAppleDevice ? "Meta" : "Control", "A"],
		(event) => {
			// Only handle when code last clicked and no focus or copy button focused
			if (
				(clickedCodeElement() && document.activeElement === document.body) ||
				(event?.target as HTMLElement | undefined)?.closest(
					"div.expressive-code",
				)
			) {
				const targetNode =
					(event?.target as HTMLElement | undefined)?.closest(
						"div.expressive-code",
					) ?? clickedCodeElement()!;

				if (window.getSelection()?.anchorNode === contentRef()) {
					return; // Code already selected, select all (default) instead.
				}

				const range = document.createRange();
				range.selectNode(targetNode);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);
				event?.preventDefault();
			}
		},
		{ preventDefault: false },
	);

	const onClick = (event: MouseEvent) => {
		if (event.target) {
			const closestCode = (event.target as HTMLElement).closest(
				"div.expressive-code",
			);
			setClickedCodeElement(
				(closestCode ?? undefined) as HTMLElement | undefined,
			);
		}
	};

	const prevNext = usePrevNext();

	const hasPrev = () =>
		(prevNext.prevLink() && pageData().layout?.prev !== false) ||
		pageData().layout?.prev;
	const hasNext = () =>
		(prevNext.nextLink() && pageData().layout?.next !== false) ||
		pageData().layout?.next;
	const customTitle = (r?: RelativePageConfig) =>
		typeof r === "string" ? r : typeof r === "object" ? r.text : undefined;
	const customLink = (r?: RelativePageConfig) =>
		typeof r === "object" ? r.link : undefined;

	return (
		<>
			<WindowEventListener onClick={onClick} />

			<article class={styles.article}>
				<div ref={setContentRef} class={styles.content}>
					<Show when={pageData().frontmatter.hero}>
						<Hero />
					</Show>
					<Show when={pageData().frontmatter.features}>
						<Features />
					</Show>

					{props.children}

					<div class={styles.info}>
						<Show
							when={pageData().editLink && pageData().layout?.editLink}
							fallback={<div />}
						>
							<Link href={pageData().editLink}>Edit this page on GitHub</Link>
						</Show>

						<Show when={pageData().layout?.lastUpdated}>
							<LastUpdated />
						</Show>
					</div>

					<Show when={hasPrev() || hasNext()}>
						<nav class={styles.related}>
							<div>
								<Show when={hasPrev()}>
									<a
										class={styles.prev}
										href={
											customLink(pageData().layout?.prev) ??
											prevNext.prevLink().link
										}
									>
										<span>Previous</span>
										{customTitle(pageData().layout?.prev) ??
											prevNext.prevLink().title}
									</a>
								</Show>
							</div>
							<div>
								<Show when={hasNext()}>
									<a
										class={styles.next}
										href={
											customLink(pageData().layout?.next) ??
											prevNext.nextLink().link
										}
									>
										<span>Next</span>
										{customLink(pageData().layout?.next) ??
											prevNext.nextLink().title}
									</a>
								</Show>
							</div>
						</nav>
					</Show>

					<Show
						when={
							(config().themeConfig?.footer ?? true) &&
							pageData().layout?.footer
						}
					>
						<Footer />
					</Show>
				</div>

				<Show when={!mobileLayout() && (pageData().layout?.toc ?? true)}>
					<aside class={styles.aside}>
						<TableOfContents />
					</aside>
				</Show>
			</article>
		</>
	);
}
