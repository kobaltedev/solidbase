import { Dialog } from "@kobalte/core/dialog";
import { Search } from "@kobalte/core/search";
import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import IconCloseLine from "~icons/ri/close-line";
import IconSearchLine from "~icons/ri/search-line";
import { useRouteSolidBaseConfig } from "../../client/config.js";
import type { DefaultThemeConfig } from "../index.js";
import { getLocalSearchScopeForPath } from "../search.js";
import { defaultThemeTextConfig } from "../text.js";
import styles from "./LocalSearch.module.css";

type LocalSearchHit = {
	url: string;
	title: string;
	titles: string[];
	excerpt: string;
};

type PagefindResultData = {
	url: string;
	plain_excerpt: string;
	meta: Record<string, string>;
};

type PagefindApi = {
	init(): Promise<void>;
	destroy(): Promise<void>;
	debouncedSearch(
		query: string,
		options: { filters: { scope: string } },
		debounce: number,
	): Promise<{
		results: Array<{ data(): Promise<PagefindResultData> }>;
	} | null>;
};

const PAGEFIND_PATH = "/pagefind/pagefind.js";

export default function LocalSearch(props: { shortcut?: boolean }) {
	const config = useRouteSolidBaseConfig<DefaultThemeConfig>();
	const location = useLocation();
	const navigate = useNavigate();
	const text = {
		...defaultThemeTextConfig,
		...config().themeConfig?.text,
	};
	const [open, setOpen] = createSignal(false);
	const [query, setQuery] = createSignal("");
	const [results, setResults] = createSignal<LocalSearchHit[]>([]);
	const [status, setStatus] = createSignal<
		"idle" | "loading" | "ready" | "error"
	>("idle");
	let pagefind: PagefindApi | undefined;
	let pagefindLanguage: string | undefined;
	let inputRef: HTMLInputElement | undefined;
	let loadId = 0;
	let searchId = 0;

	const scope = () => getLocalSearchScopeForPath(location.pathname, config());

	async function loadPagefind() {
		const currentLoad = ++loadId;
		const language = document.documentElement.lang.toLowerCase();
		if (pagefind && pagefindLanguage === language) {
			setStatus("ready");
			return;
		}
		setStatus("loading");

		try {
			if (pagefind) await pagefind.destroy();
			pagefind = (await import(
				/* @vite-ignore */ PAGEFIND_PATH
			)) as PagefindApi;
			await pagefind.init();
			if (currentLoad !== loadId) return;
			pagefindLanguage = language;
			setStatus("ready");
			if (query()) void search(query());
		} catch {
			if (currentLoad === loadId) setStatus("error");
		}
	}

	async function search(value: string) {
		setQuery(value);
		const currentSearch = ++searchId;
		if (!value) {
			setResults([]);
			if (pagefind) setStatus("ready");
			return;
		}
		if (!pagefind) return;
		setStatus("loading");

		try {
			const response = await pagefind.debouncedSearch(
				value,
				{ filters: { scope: scope() } },
				150,
			);
			if (!response || currentSearch !== searchId) return;
			const data = await Promise.all(
				response.results.slice(0, 10).map((result) => result.data()),
			);
			if (currentSearch !== searchId) return;
			setResults(
				data.map((result) => ({
					url: result.url,
					title: result.meta.title ?? result.url,
					titles: result.meta.breadcrumb?.split(" › ") ?? [],
					excerpt: result.plain_excerpt,
				})),
			);
			setStatus("ready");
		} catch {
			if (currentSearch === searchId) setStatus("error");
		}
	}

	function onOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (nextOpen) {
			void loadPagefind();
		} else {
			loadId++;
			searchId++;
			setQuery("");
			setResults([]);
			setStatus(pagefind ? "ready" : "idle");
		}
	}

	onMount(() => {
		if (!props.shortcut) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() !== "k" ||
				!(event.metaKey || event.ctrlKey)
			) {
				return;
			}
			event.preventDefault();
			onOpenChange(true);
		};

		document.addEventListener("keydown", onKeyDown);
		onCleanup(() => document.removeEventListener("keydown", onKeyDown));
	});

	return (
		<Dialog open={open()} onOpenChange={onOpenChange}>
			<Dialog.Trigger
				type="button"
				class={styles.trigger}
				aria-label={text.search}
				aria-keyshortcuts={props.shortcut ? "Meta+K Control+K" : undefined}
			>
				<IconSearchLine aria-hidden />
				<span>{text.search}</span>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay class={styles.overlay} />
				<Dialog.Content
					role="dialog"
					class={styles.dialog}
					onOpenAutoFocus={(event) => {
						event.preventDefault();
						queueMicrotask(() => inputRef?.focus());
					}}
				>
					<div class={styles.header}>
						<Dialog.Title class={styles.title}>{text.search}</Dialog.Title>
						<Dialog.CloseButton
							class={styles.close}
							aria-label={text.searchClose}
						>
							<IconCloseLine aria-hidden />
						</Dialog.CloseButton>
					</div>
					<Search<LocalSearchHit>
						open
						modal={false}
						options={results()}
						optionValue="url"
						optionTextValue="title"
						optionLabel="title"
						placeholder={text.searchPlaceholder}
						onInputChange={(value) => void search(value)}
						onChange={(result) => {
							if (!result) return;
							onOpenChange(false);
							void navigate(result.url);
						}}
						itemComponent={(props) => (
							<Search.Item class={styles.item} item={props.item}>
								<Search.ItemLabel class={styles["item-title"]}>
									{props.item.rawValue.title}
								</Search.ItemLabel>
								<Show when={props.item.rawValue.titles.length > 0}>
									<div class={styles.path}>
										{props.item.rawValue.titles.join(" › ")}
									</div>
								</Show>
								<Show when={props.item.rawValue.excerpt}>
									<div
										class={styles.excerpt}
										innerHTML={props.item.rawValue.excerpt}
									/>
								</Show>
							</Search.Item>
						)}
					>
						<Search.Label class={styles.label}>{text.search}</Search.Label>
						<Search.Control class={styles.control}>
							<IconSearchLine aria-hidden />
							<Search.Input ref={inputRef} class={styles.input} />
						</Search.Control>
						<div class={styles.content}>
							<Show when={status() === "loading"}>
								<div class={styles.status} role="status">
									{text.searchLoading}
								</div>
							</Show>
							<Show when={status() === "error"}>
								<div class={styles.status} role="alert">
									{text.searchUnavailable}
								</div>
							</Show>
							<Show when={status() === "ready" && query()}>
								<Search.NoResult class={styles.status} role="status">
									{text.searchNoResults}
								</Search.NoResult>
							</Show>
							<Search.Listbox class={styles.list} />
						</div>
					</Search>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
}
