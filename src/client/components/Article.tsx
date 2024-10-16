import { solidBaseConfig } from "virtual:solidbase";
import { WindowEventListener } from "@solid-primitives/event-listener";
import { createShortcut } from "@solid-primitives/keyboard";
import { isAppleDevice } from "@solid-primitives/platform";
import { type ParentProps, Show, createSignal } from "solid-js";
import { useSolidBaseContext } from "../context";
import { useCurrentPageData } from "../page-data";
import styles from "./Article.module.css";

export default function Article(props: ParentProps) {
	const { TableOfContents, Link, LastUpdated, Footer } =
		useSolidBaseContext().components;

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

					<Show when={pageData().lastUpdated || pageData().lastUpdated}>
						<div class={styles.related}>
							<Show when={pageData().lastUpdated} fallback={<div />}>
								<a class={styles.prev} href={"/"}>
									<span>Previous</span>
									TITLE
								</a>
							</Show>
							<Show when={pageData().lastUpdated}>
								<a class={styles.next} href={"/"}>
									<span>Next</span>
									TITLE
								</a>
							</Show>
						</div>
					</Show>

					<Show when={solidBaseConfig.footer}>
						<Footer />
					</Show>
				</div>

				<aside class={styles.aside}>
					<TableOfContents />
				</aside>
			</article>
		</>
	);
}
