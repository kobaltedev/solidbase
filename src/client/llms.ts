import { createSignal, onCleanup } from "solid-js";

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
		headers: { Accept: "text/plain" },
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
	clipboard = globalThis.navigator?.clipboard,
) {
	if (!clipboard?.writeText) {
		throw new Error("Clipboard API unavailable");
	}

	await clipboard.writeText(text);
}

export function clearPageMarkdownCache() {
	markdownCache.clear();
}

export function useCopyPageMarkdown() {
	const pageData = useCurrentPageData();
	const config = useRouteSolidBaseConfig<any>();
	const [state, setState] = createSignal<CopyPageState>("idle");
	const [isCopying, setIsCopying] = createSignal(false);

	let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

	onCleanup(() => {
		if (feedbackTimeout) clearTimeout(feedbackTimeout);
	});

	const canCopy = () =>
		canCopyPageMarkdown(config().llms, pageData()?.frontmatter.llms);

	async function copy() {
		if (isCopying()) return false;

		setIsCopying(true);

		try {
			const markdown = await getCurrentPageMarkdown();
			await copyTextToClipboard(markdown);
			setState("success");
			return true;
		} catch (error) {
			console.error("[solidbase] Failed to copy page markdown", error);
			setState("error");
			return false;
		} finally {
			if (feedbackTimeout) clearTimeout(feedbackTimeout);
			feedbackTimeout = setTimeout(() => setState("idle"), BUTTON_RESET_MS);
			setIsCopying(false);
		}
	}

	return {
		canCopy,
		copy,
		isCopying,
		state,
	};
}
