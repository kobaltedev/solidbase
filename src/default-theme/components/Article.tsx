import { WindowEventListener } from "@solid-primitives/event-listener";
import { createShortcut } from "@solid-primitives/keyboard";
import { isAppleDevice } from "@solid-primitives/platform";
import { type ParentProps, Show, createSignal } from "solid-js";

import { useCurrentPageData } from "../../client/page-data";
import { useThemeComponents } from "../context";
import { mobileLayout } from "../globals";
import { usePrevNext } from "../sidebar";
import { useSolidBaseContext } from "../utils";

import styles from "./Article.module.css";

export default function Article(props: ParentProps) {
	const { config } = useSolidBaseContext();

	const { TableOfContents, Link, LastUpdated, Footer } = useThemeComponents();

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

	return (
		<>
			<WindowEventListener onClick={onClick} />

			<article class={styles.article}>
				<div ref={setContentRef} class={styles.content}>
					{props.children}

					<div class={styles.info}>
						<Show when={pageData().editLink}>
							<Link href={pageData().editLink}>Edit this page on GitHub</Link>
						</Show>

						<Show when={pageData().lastUpdated}>
							<LastUpdated />
						</Show>
					</div>

					<Show when={prevNext.prevLink() || prevNext.nextLink()}>
						<nav class={styles.related}>
							<div>
								<Show when={prevNext.prevLink()}>
									{(link) => (
										<a class={styles.prev} href={link().link}>
											<span>Previous</span>
											{link().title}
										</a>
									)}
								</Show>
							</div>
							<div>
								<Show when={prevNext.nextLink()}>
									{(link) => (
										<a class={styles.next} href={link().link}>
											<span>Next</span>
											{link().title}
										</a>
									)}
								</Show>
							</div>
						</nav>
					</Show>

					<Show when={config().themeConfig?.footer}>
						<Footer />
					</Show>
				</div>

				<Show when={!mobileLayout()}>
					<aside class={styles.aside}>
						<TableOfContents />
					</aside>
				</Show>
			</article>
		</>
	);
}
