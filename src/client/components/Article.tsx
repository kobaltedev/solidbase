import { WindowEventListener } from "@solid-primitives/event-listener";
import { createShortcut } from "@solid-primitives/keyboard";
import { JSX, type ParentProps, Show, createSignal } from "solid-js";
import { useSolidBaseContext } from "../context";
import { useCurrentPageData } from "../page-data";
import styles from "./Article.module.css";
import Link from "./Link";

export default function Article(props: ParentProps) {
	const { TableOfContent } = useSolidBaseContext().components;

	const [articleRef, setArticleRef] = createSignal<HTMLElement>();

	const [clickedCodeElement, setClickedCodeElement] =
		createSignal<HTMLElement>();

	const pageData = useCurrentPageData();

	createShortcut(
		["Control", "A"],
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

				if (window.getSelection()?.anchorNode === articleRef()) {
					return; // Code already selected, select all (default) instead.
				}

				const range = document.createRange();
				range.selectNode(targetNode);
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

			<article ref={setArticleRef} class={styles.article}>
				<div class={styles.content}>
					{props.children}

					<hr />

					<Show when={pageData().editLink}>
						<Link href={pageData().editLink}>Edit this page on GitHub</Link>
					</Show>
				</div>

				<aside class={styles.aside}>
					<TableOfContent />
				</aside>
			</article>
		</>
	);
}
