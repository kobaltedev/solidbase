import type { Tab } from "solid-repl";
import CompilerWorker from "solid-repl/dist/compiler?worker";
import FormatterWorker from "solid-repl/dist/formatter?worker";
import SolidRepl from "solid-repl/dist/repl.jsx";

import "solid-repl/dist/bundle.css";

import { createMediaQuery } from "@solid-primitives/media";
import {
	createEffect,
	createMemo,
	createSignal,
	createUniqueId,
	onCleanup,
	Show,
	untrack,
} from "solid-js";
import ExitFullscreenIcon from "~icons/ri/fullscreen-exit-line";
import FullscreenIcon from "~icons/ri/fullscreen-line";

import { getTheme } from "../../client/theme.js";
import { createReplLayout } from "../repl-layout.js";
import { useThemeText } from "../utils.js";
import type { ReplProps } from "./Repl.jsx";
import styles from "./Repl.module.css";

interface ReplWorkers {
	compiler: Worker;
	formatter: Worker;
}

let workers: ReplWorkers | undefined;
let users = 0;

function useReplWorkers() {
	workers ??= {
		compiler: new CompilerWorker(),
		formatter: new FormatterWorker(),
	};
	users++;

	onCleanup(() => {
		if (--users > 0 || !workers) return;
		workers.compiler.terminate();
		workers.formatter.terminate();
		workers = undefined;
	});

	return workers;
}

// Makes the page behind a full screen REPL unreachable: no scrolling, and no tabbing or screen
// reader access. Body children stay untouched because solid-repl portals its menus there.
function isolateFromPage(element: HTMLElement) {
	const inerted: Element[] = [];

	for (
		let node = element;
		node.parentElement && node.parentElement !== document.body;
		node = node.parentElement
	) {
		for (const sibling of Array.from(node.parentElement.children)) {
			if (sibling === node || sibling.hasAttribute("inert")) continue;
			sibling.setAttribute("inert", "");
			inerted.push(sibling);
		}
	}

	const { style } = document.documentElement;
	const overflow = style.overflow;
	style.overflow = "hidden";

	return () => {
		for (const sibling of inerted) sibling.removeAttribute("inert");
		style.overflow = overflow;
	};
}

export default function ReplClient(props: ReplProps) {
	const { compiler, formatter } = useReplWorkers();
	const text = useThemeText();

	const id = `sb-repl-${createUniqueId()}`;
	const initialTabs = () => props.tabs.map((tab) => ({ ...tab }));
	const [tabs, setTabs] = createSignal<Tab[]>(initialTabs());

	const dark = createMemo(() => getTheme() === "dark");
	const devtools = () =>
		props.devtools === true ||
		(typeof props.devtools === "string" && props.devtools !== "false");

	const [fullscreen, setFullscreen] = createSignal(false);
	// Narrow viewports use solid-repl's tabbed mobile layout, which ignores `vertical`.
	const staysStacked = createMediaQuery(
		"(orientation: portrait), (max-width: 767px)",
	);
	const stacked = () =>
		props.layout !== "horizontal" && (!fullscreen() || staysStacked());
	let frame!: HTMLDivElement;
	let toggle!: HTMLButtonElement;

	const toggleFullscreen = (active: boolean) => {
		setFullscreen(active);
		// Changing the layout remounts the editor, which takes focus as it mounts.
		requestAnimationFrame(() => toggle.focus());
	};

	createEffect(fullscreen, (active) => {
		if (!active) return;

		const restorePage = isolateFromPage(frame);
		// The editor and menus claim Escape first (closing a popup) by preventing its default.
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !event.defaultPrevented) {
				toggleFullscreen(false);
			}
		};
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("keydown", onKeyDown);
			restorePage();
		};
	});

	const repl = () => (
		<SolidRepl
			id={id}
			compiler={compiler}
			formatter={formatter}
			dark={dark()}
			tabs={tabs()}
			setTabs={setTabs}
			reset={() => setTabs(initialTabs())}
			storage={{
				getLayout: () => createReplLayout(untrack(tabs), stacked()),
			}}
			hideDevtools={!devtools()}
			vertical={stacked()}
		/>
	);

	return (
		<div
			ref={frame}
			class={styles.frame}
			data-fullscreen={fullscreen() ? "" : undefined}
		>
			<div class={styles.toolbar}>
				<button
					ref={toggle}
					type="button"
					class={styles.fullscreenToggle}
					aria-pressed={fullscreen() ? "true" : "false"}
					title={fullscreen() ? text.replExitFullscreen : undefined}
					onClick={() => toggleFullscreen(!fullscreen())}
				>
					{fullscreen() ? <ExitFullscreenIcon /> : <FullscreenIcon />}
					{text.replFullscreen}
				</button>
			</div>
			{/* solid-repl only reads `vertical` on mount, so changing it takes a new instance */}
			<Show when={stacked()} fallback={repl()}>
				{repl()}
			</Show>
		</div>
	);
}
