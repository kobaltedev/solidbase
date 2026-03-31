import { createSignal, onCleanup, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { useCurrentPageData } from "../../client/index.jsx";
import { useRouteConfig, useThemeText } from "../utils.js";
import styles from "./CopyPageLink.module.css";
import { CheckIcon, CopyIcon, CrossIcon } from "./icons.jsx";

const markdownCache = new Map<string, string>();
const BUTTON_RESET_MS = 2500;

type CopyState = "idle" | "success" | "error";

function toMarkdownPath(pathname: string) {
	if (pathname === "/") return "/index.md";

	return `${pathname.replace(/\/$/, "")}.md`;
}

function getMarkdownPath() {
	const pathname = globalThis.location?.pathname;
	return pathname ? toMarkdownPath(pathname) : undefined;
}

async function getMarkdownContent() {
	const markdownPath = getMarkdownPath();

	if (!markdownPath) {
		throw new Error("Missing pathname");
	}

	const cached = markdownCache.get(markdownPath);
	if (cached) {
		return cached;
	}

	const response = await fetch(markdownPath, {
		headers: { Accept: "text/plain" },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch markdown: ${response.status}`);
	}

	const content = await response.text();
	markdownCache.set(markdownPath, content);
	return content;
}

async function copyText(text: string) {
	const clipboard = globalThis.navigator?.clipboard;

	if (!clipboard?.writeText) {
		throw new Error("Clipboard API unavailable");
	}

	await clipboard.writeText(text);
}

function getStateIcon(state: CopyState) {
	switch (state) {
		case "success":
			return CheckIcon;
		case "error":
			return CrossIcon;
		default:
			return CopyIcon;
	}
}

export default function CopyPageLink() {
	const pageData = useCurrentPageData();
	const config = useRouteConfig();
	const text = useThemeText();
	const [state, setState] = createSignal<CopyState>("idle");
	const [isCopying, setIsCopying] = createSignal(false);

	let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

	onCleanup(() => {
		if (feedbackTimeout) clearTimeout(feedbackTimeout);
	});

	function canCopy() {
		const llms = pageData()?.frontmatter.llms;
		return config().llms && !llms?.exclude;
	}

	function label() {
		switch (state()) {
			case "success":
				return text.copiedPage;
			case "error":
				return text.copyFailedPage;
			default:
				return text.copyPage;
		}
	}

	async function handleCopy() {
		if (isCopying()) return;

		setIsCopying(true);

		try {
			await copyText(await getMarkdownContent());
			setState("success");
		} catch (error) {
			console.error("[solidbase] Failed to copy page markdown", error);
			setState("error");
		} finally {
			if (feedbackTimeout) clearTimeout(feedbackTimeout);
			feedbackTimeout = setTimeout(() => setState("idle"), BUTTON_RESET_MS);
			setIsCopying(false);
		}
	}

	return (
		<Show when={canCopy()}>
			<button
				type="button"
				class={styles.button}
				classList={{
					[styles.success]: state() === "success",
					[styles.error]: state() === "error",
				}}
				onClick={handleCopy}
				disabled={isCopying()}
				aria-live="polite"
			>
				<Dynamic component={getStateIcon(state())} class={styles.icon} />
				<span>{label()}</span>
			</button>
		</Show>
	);
}
