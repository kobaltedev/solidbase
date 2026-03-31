import { createMemo, createSignal, onCleanup, Show } from "solid-js";

import { useCurrentPageData } from "../../client/index.jsx";
import { useRouteConfig } from "../utils.js";
import styles from "./CopyPageLink.module.css";
import { CheckIcon, CopyIcon } from "./icons.jsx";

const markdownCache = new Map<string, string>();

function toMarkdownPath(pathname: string) {
	if (pathname === "/") return "/index.md";

	return `${pathname.replace(/\/$/, "")}.md`;
}

export default function CopyPageLink() {
	const pageData = useCurrentPageData();
	const config = useRouteConfig();
	const [copied, setCopied] = createSignal(false);
	const [isCopying, setIsCopying] = createSignal(false);

	let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

	onCleanup(() => {
		if (copiedTimeout) clearTimeout(copiedTimeout);
	});

	const isExcluded = createMemo(() => {
		const llms = pageData()?.frontmatter.llms;

		return llms?.exclude;
	});

	const canCopy = createMemo(() => config().llms && !isExcluded());

	const label = createMemo(() =>
		copied() ? "Copied page for LLM" : "Copy page for LLM",
	);

	async function handleCopy() {
		if (isCopying()) return;

		const clipboard = globalThis.navigator?.clipboard;
		const pathname = globalThis.location?.pathname;

		if (!clipboard || !pathname) return;

		setIsCopying(true);

		const markdownPath = toMarkdownPath(pathname);

		try {
			const content = markdownCache.has(markdownPath)
				? markdownCache.get(markdownPath)!
				: await fetch(markdownPath).then(async (response) => {
						if (!response.ok) {
							throw new Error(`Failed to fetch markdown: ${response.status}`);
						}

						const text = await response.text();
						markdownCache.set(markdownPath, text);
						return text;
					});

			await clipboard.writeText(content);
		} catch {
			await clipboard.writeText(globalThis.location.href);
		} finally {
			setCopied(true);

			if (copiedTimeout) clearTimeout(copiedTimeout);
			copiedTimeout = setTimeout(() => setCopied(false), 2000);
			setIsCopying(false);
		}
	}

	return (
		<Show when={canCopy()}>
			<button
				type="button"
				class={styles.button}
				onClick={() => void handleCopy()}
				disabled={isCopying()}
				aria-live="polite"
			>
				<Show when={copied()} fallback={<CopyIcon class={styles.icon} />}>
					<CheckIcon class={styles.icon} />
				</Show>
				{label()}
			</button>
		</Show>
	);
}
