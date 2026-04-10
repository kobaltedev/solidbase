import {
	type ClipboardSetter,
	writeClipboard,
} from "@solid-primitives/clipboard";
import { useLocation } from "@solidjs/router";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import { useRouteSolidBaseConfig } from "./config.js";
import { type BaseFrontmatter, useCurrentPageData } from "./page-data.js";

const markdownCache = new Map<string, string>();
const BUTTON_RESET_MS = 2500;

export type CopyPageState = "idle" | "success" | "error";

function isLlmsDisabled(llms: BaseFrontmatter["llms"]) {
	return llms === false || llms?.exclude === true;
}

export function canCopyPageMarkdown(
	configLlms: boolean | undefined,
	llms: BaseFrontmatter["llms"],
) {
	return Boolean(configLlms) && !isLlmsDisabled(llms);
}

export function toMarkdownPath(pathname: string) {
	if (pathname === "/") return "/index.md";

	return `${pathname.replace(/\/$/, "")}.md`;
}

export function getCurrentPageMarkdownPath(
	pathname = globalThis.location?.pathname,
) {
	return pathname ? toMarkdownPath(pathname) : undefined;
}

export async function getCurrentPageMarkdown(
	pathname = globalThis.location?.pathname,
	fetchImpl = globalThis.fetch,
) {
	const markdownPath = getCurrentPageMarkdownPath(pathname);

	if (!markdownPath) {
		throw new Error("Missing pathname");
	}

	const cached = markdownCache.get(markdownPath);
	if (cached) {
		return cached;
	}

	const response = await fetchImpl(markdownPath, {
		headers: { Accept: "text/markdown" },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch markdown: ${response.status}`);
	}

	const content = await response.text();
	markdownCache.set(markdownPath, content);
	return content;
}

export async function copyTextToClipboard(
	text: string,
	writeText: ClipboardSetter = writeClipboard,
) {
	if (!globalThis.navigator?.clipboard?.writeText) {
		throw new Error("Clipboard API unavailable");
	}

	await writeText(text);
}

export function clearPageMarkdownCache() {
	markdownCache.clear();
}

export function useCopyPageMarkdown() {
	const location = useLocation();
	const pageData = useCurrentPageData();
	const config = useRouteSolidBaseConfig<any>();
	const [state, setState] = createSignal<CopyPageState>("idle");
	const [isCopying, setIsCopying] = createSignal(false);
	const [isClient, setIsClient] = createSignal(false);

	let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

	function clearFeedbackTimeout() {
		if (!feedbackTimeout) return;
		clearTimeout(feedbackTimeout);
		feedbackTimeout = undefined;
	}

	function resetCopyFeedback() {
		setState("idle");
		setIsCopying(false);
		clearFeedbackTimeout();
	}

	onMount(() => {
		setIsClient(true);
	});

	onCleanup(() => {
		clearFeedbackTimeout();
	});

	createEffect(() => {
		location.pathname;
		resetCopyFeedback();
	});

	const canCopy = () =>
		canCopyPageMarkdown(config().llms, pageData()?.frontmatter.llms);
	const isReady = () => isClient() && canCopy();

	async function copy() {
		if (!isReady() || isCopying()) return false;

		const startedPathname = location.pathname;
		setIsCopying(true);

		try {
			const markdown = await getCurrentPageMarkdown(startedPathname);
			if (location.pathname !== startedPathname) return false;
			await copyTextToClipboard(markdown);
			if (location.pathname !== startedPathname) return false;
			setState("success");
			return true;
		} catch (error) {
			if (location.pathname !== startedPathname) return false;
			console.error("[solidbase] Failed to copy page markdown", error);
			setState("error");
			return false;
		} finally {
			clearFeedbackTimeout();
			if (location.pathname === startedPathname) {
				feedbackTimeout = setTimeout(() => setState("idle"), BUTTON_RESET_MS);
			} else {
				clearFeedbackTimeout();
			}
			setIsCopying(false);
		}
	}

	return {
		canCopy,
		copy,
		isCopying,
		isReady,
		state,
	};
}
