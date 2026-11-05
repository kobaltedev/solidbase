import { clientOnly, type JSX } from "@solidjs/web";
import {
	createEffect,
	createSignal,
	Errored,
	Loading,
	Show,
	untrack,
} from "solid-js";
import type { ReplTab } from "../../config/remark-plugins/repl.js";
import { SOLID_REPL_ROOT_CLASS } from "../repl-constants.js";
import { useRouteConfig, useThemeText } from "../utils.js";
import styles from "./Repl.module.css";

export interface ReplProps {
	tabs: ReplTab[];
	height?: string;
	layout?: "vertical" | "horizontal";
	devtools?: boolean | string;
	mode?: "full" | "preview";
	lazy?: boolean | string;
}

// solid-repl depends on Web Workers, dockview and CodeMirror, none of which run on the server.
// The virtual module is a stub when solid-repl isn't installed (see ../repl.ts).
function ReplClient(props: ReplProps & { fallback: JSX.Element }) {
	// clientOnly starts its import when defined, not when its component mounts.
	// Define it inside the viewport gate so offscreen REPLs load no heavy code.
	const Client = clientOnly(
		() => import("virtual:solidbase/default-theme/repl-client"),
	);
	return <Client {...props} />;
}

export function Repl(props: ReplProps) {
	const text = useThemeText();
	const config = useRouteConfig();
	const mode = () => props.mode ?? config().themeConfig?.repl?.mode ?? "full";
	const lazy = () => {
		const value = props.lazy ?? config().themeConfig?.repl?.lazy;
		return value === undefined
			? mode() === "preview"
			: value !== false && value !== "false";
	};
	const [ready, setReady] = createSignal(false);
	let root!: HTMLDivElement;

	// Effects only run in the browser. Keep the dynamic import behind this gate too:
	// creating the clientOnly wrapper itself must also wait for this gate.
	createEffect(lazy, (defer) => {
		if (untrack(ready)) return;
		if (!defer || typeof IntersectionObserver === "undefined") {
			setReady(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				setReady(true);
			},
			{ rootMargin: "300px" },
		);
		observer.observe(root);
		return () => observer.disconnect();
	});
	const loading = () => <div class={styles.loading}>{text.replLoading}</div>;

	return (
		<div
			ref={root}
			class={`${styles.repl} ${SOLID_REPL_ROOT_CLASS}`}
			data-mode={mode()}
			style={{ "--sb-repl-height": props.height }}
		>
			<Errored
				fallback={(error) => {
					console.error(error());
					return <div class={styles.loading}>{text.replError}</div>;
				}}
			>
				<Show when={ready()} fallback={loading()}>
					<Loading fallback={loading()}>
						{/* ReplClient takes its tabs once at setup, so mount it with resolved tabs and remount when they change. */}
						<Show when={props.tabs} keyed>
							{(tabs) => (
								<ReplClient
									{...props}
									mode={mode()}
									tabs={tabs}
									fallback={loading()}
								/>
							)}
						</Show>
					</Loading>
				</Show>
			</Errored>
		</div>
	);
}
