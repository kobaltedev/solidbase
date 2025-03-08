import { WindowEventListener } from "@solid-primitives/event-listener";
import { createShortcut } from "@solid-primitives/keyboard";
import { isAppleDevice } from "@solid-primitives/platform";
import { ErrorBoundary, type ParentProps, Show, createSignal } from "solid-js";

import { useCurrentPageData } from "../../client";
import { mobileLayout } from "../globals";
import { usePrevNext } from "../sidebar";
import { useSolidBaseContext } from "../utils";

import { useDefaultThemeComponents, useDefaultThemeState } from "../context";
import type { RelativePageConfig } from "../frontmatter";
import styles from "./Article.module.css";

export default function Article(props: ParentProps) {
	const { config } = useSolidBaseContext();
	const { frontmatter } = useDefaultThemeState();

	const { TableOfContents, Link, LastUpdated, Footer, Hero, Features } =
		useDefaultThemeComponents();

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
		(prevNext.prevLink() && frontmatter()?.prev !== false) ||
		frontmatter()?.prev;
	const hasNext = () =>
		(prevNext.nextLink() && frontmatter()?.next !== false) ||
		frontmatter()?.next;
	const customTitle = (r?: RelativePageConfig) =>
		typeof r === "string" ? r : typeof r === "object" ? r.text : undefined;
	const customLink = (r?: RelativePageConfig) =>
		typeof r === "object" ? r.link : undefined;

	return (
		<>
			<WindowEventListener onClick={onClick} />

			<article class={styles.article}>
				<div ref={setContentRef} class={styles.content}>
					<Show when={frontmatter()?.hero}>
						{(data) => <Hero data={data()} />}
					</Show>
					<Show when={frontmatter()?.features}>
						{(data) => <Features features={data()} />}
					</Show>

					{props.children}

					<div class={styles.info}>
						<Show
							when={pageData()?.editLink && frontmatter()?.editLink}
							fallback={<div />}
						>
							<Link href={pageData()?.editLink}>Edit this page on GitHub</Link>
						</Show>

						<Show when={frontmatter()?.lastUpdated}>
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
											customLink(frontmatter()?.prev) ??
											prevNext.prevLink().link
										}
									>
										<span>Previous</span>
										{customTitle(frontmatter()?.prev) ??
											prevNext.prevLink().title}
									</a>
								</Show>
							</div>
							<div>
								<Show when={hasNext()}>
									<a
										class={styles.next}
										href={
											customLink(frontmatter()?.next) ??
											prevNext.nextLink().link
										}
									>
										<span>Next</span>
										{customLink(frontmatter()?.next) ??
											prevNext.nextLink().title}
									</a>
								</Show>
							</div>
						</nav>
					</Show>

					<Show
						when={
							config().themeConfig?.footer !== false && frontmatter()?.footer !== false
						}
					>
						<Footer />
					</Show>
				</div>

				<Show
					when={
						!mobileLayout() &&
						(frontmatter()?.toc ?? frontmatter()?.layout !== "home")
					}
				>
					<aside class={styles.aside}>
						<TableOfContents />
					</aside>
				</Show>
			</article>
		</>
	);
}
