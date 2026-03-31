import { DropdownMenu } from "@kobalte/core";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { useCurrentPageData } from "../../client/index.jsx";
import {
	type DefaultThemeLlmActionType,
	defaultThemeLlmActions,
} from "../index.js";
import { useRouteConfig, useThemeText } from "../utils.js";
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

function getPageUrl() {
	return globalThis.location?.href;
}

type ResolvedAction = {
	type: DefaultThemeLlmActionType;
	label: string;
	icon: typeof CopyIcon;
	run: () => void | Promise<void>;
};

export default function CopyPageLink() {
	const pageData = useCurrentPageData();
	const config = useRouteConfig();
	const text = useThemeText();
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

	const configuredActions = createMemo(() => {
		const actions = config().themeConfig?.llmActions;

		if (actions === false) return [];

		return actions?.length ? actions : defaultThemeLlmActions;
	});

	const canCopy = createMemo(
		() => config().llms && !isExcluded() && configuredActions().length > 0,
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

	function openPromptUrl(baseUrl: string, param: string) {
		const pageUrl = getPageUrl();

		if (!pageUrl) return;

		const url = new URL(baseUrl);
		url.searchParams.set(param, `Read this documentation page: ${pageUrl}`);
		globalThis.open(url.toString(), "_blank", "noopener,noreferrer");
	}

	function openCursor() {
		const pageUrl = getPageUrl();

		if (!pageUrl) return;

		globalThis.location.href = `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(
			`Read this documentation page: ${pageUrl}`,
		)}`;
	}

	const actions = createMemo<Array<ResolvedAction>>(() => {
		const resolved: Array<ResolvedAction> = [];

		for (const action of configuredActions()) {
			switch (action) {
				case "copy":
					resolved.push({
						type: action,
						label: copied() ? text.copiedPage : text.copyPage,
						icon: copied() ? CheckIcon : CopyIcon,
						run: handleCopy,
					});
					break;
				case "markdown":
					resolved.push({
						type: action,
						label: text.viewMarkdown,
						icon: ExternalLinkIcon,
						run: handleViewMarkdown,
					});
					break;
				case "chatgpt":
					resolved.push({
						type: action,
						label: text.openInChatGpt,
						icon: ExternalLinkIcon,
						run: () => openPromptUrl("https://chatgpt.com/", "q"),
					});
					break;
				case "claude":
					resolved.push({
						type: action,
						label: text.openInClaude,
						icon: ExternalLinkIcon,
						run: () => openPromptUrl("https://claude.ai/new", "q"),
					});
					break;
				case "cursor":
					resolved.push({
						type: action,
						label: text.openInCursor,
						icon: ExternalLinkIcon,
						run: openCursor,
					});
					break;
			}
		}

		return resolved;
	});

	const primaryAction = createMemo(() => actions()[0]);
	const menuActions = createMemo(() => actions().slice(1));

	return (
		<Show when={canCopy()}>
			<Show when={primaryAction()} fallback={null}>
				{(action) => (
					<Show
						when={menuActions().length > 0}
						fallback={
							<button
								type="button"
								class={`${styles.button} ${styles.group}`}
								onClick={() => void action().run()}
								disabled={isCopying() && action().type === "copy"}
								aria-live={action().type === "copy" ? "polite" : undefined}
							>
								<Dynamic component={action().icon} class={styles.icon} />
								{action().label}
							</button>
						}
					>
						<DropdownMenu.Root gutter={8} placement="bottom-end">
							<div class={styles.group}>
								<button
									type="button"
									class={`${styles.button} ${styles.primary}`}
									onClick={() => void action().run()}
									disabled={isCopying() && action().type === "copy"}
									aria-live={action().type === "copy" ? "polite" : undefined}
								>
									<Dynamic component={action().icon} class={styles.icon} />
									{action().label}
								</button>

								<DropdownMenu.Trigger
									class={`${styles.button} ${styles.trigger}`}
									aria-label={text.copyPageActions}
								>
									<ArrowDownIcon class={styles.icon} />
								</DropdownMenu.Trigger>
							</div>

							<DropdownMenu.Portal>
								<DropdownMenu.Content class={styles.menuContent}>
									<For each={menuActions()}>
										{(item) => (
											<DropdownMenu.Item
												class={styles.menuItem}
												onSelect={() => void item.run()}
											>
												<Dynamic component={item.icon} class={styles.icon} />
												<span class={styles.menuText}>{item.label}</span>
											</DropdownMenu.Item>
										)}
									</For>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					</Show>
				)}
			</Show>
		</Show>
	);
}
