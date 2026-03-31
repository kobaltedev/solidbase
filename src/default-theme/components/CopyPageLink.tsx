import { DropdownMenu } from "@kobalte/core";
import { createMemo, createSignal, onCleanup, Show } from "solid-js";

import { useCurrentPageData } from "../../client/index.jsx";
import { useRouteConfig } from "../utils.js";
import styles from "./CopyPageLink.module.css";
import {
	ArrowDownIcon,
	CheckIcon,
	CopyIcon,
	ExternalLinkIcon,
} from "./icons.jsx";

const markdownCache = new Map<string, string>();

function toMarkdownPath(pathname: string) {
	if (pathname === "/") return "/index.md";

	return `${pathname.replace(/\/$/, "")}.md`;
}

function getMarkdownPath() {
	const pathname = globalThis.location?.pathname;

	if (!pathname) return;

	return toMarkdownPath(pathname);
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

	async function getMarkdownContent() {
		const markdownPath = getMarkdownPath();

		if (!markdownPath) throw new Error("Missing pathname");

		if (markdownCache.has(markdownPath)) {
			return markdownCache.get(markdownPath)!;
		}

		const response = await fetch(markdownPath);

		if (!response.ok) {
			throw new Error(`Failed to fetch markdown: ${response.status}`);
		}

		const text = await response.text();
		markdownCache.set(markdownPath, text);
		return text;
	}

	async function handleCopy() {
		if (isCopying()) return;

		const clipboard = globalThis.navigator?.clipboard;

		if (!clipboard) return;

		setIsCopying(true);

		try {
			const content = await getMarkdownContent();
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

	function handleViewMarkdown() {
		const markdownPath = getMarkdownPath();

		if (!markdownPath) return;

		globalThis.open(markdownPath, "_blank", "noopener,noreferrer");
	}

	return (
		<Show when={canCopy()}>
			<DropdownMenu.Root gutter={8} placement="bottom-end">
				<div class={styles.group}>
					<button
						type="button"
						class={`${styles.button} ${styles.primary}`}
						onClick={() => void handleCopy()}
						disabled={isCopying()}
						aria-live="polite"
					>
						<Show when={copied()} fallback={<CopyIcon class={styles.icon} />}>
							<CheckIcon class={styles.icon} />
						</Show>
						{label()}
					</button>

					<DropdownMenu.Trigger
						class={`${styles.button} ${styles.trigger}`}
						aria-label="Open copy page actions"
					>
						<ArrowDownIcon class={styles.icon} />
					</DropdownMenu.Trigger>
				</div>

				<DropdownMenu.Portal>
					<DropdownMenu.Content class={styles.menuContent}>
						<DropdownMenu.Item
							class={styles.menuItem}
							onSelect={() => void handleCopy()}
						>
							<CopyIcon class={styles.icon} />
							<span class={styles.menuText}>Copy page for LLM</span>
						</DropdownMenu.Item>

						<DropdownMenu.Item
							class={styles.menuItem}
							onSelect={handleViewMarkdown}
						>
							<ExternalLinkIcon class={styles.icon} />
							<span class={styles.menuText}>View generated markdown</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</Show>
	);
}
