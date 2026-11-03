import { clientOnly } from "@solidjs/web";
import { Errored, Loading, Show } from "solid-js";
import type { ReplTab } from "../../config/remark-plugins/repl.js";
import { SOLID_REPL_ROOT_CLASS } from "../repl-constants.js";
import { useThemeText } from "../utils.js";
import styles from "./Repl.module.css";

export interface ReplProps {
	tabs: ReplTab[];
	height?: string;
	layout?: "vertical" | "horizontal";
	devtools?: boolean | string;
}

// solid-repl depends on Web Workers, dockview and CodeMirror, none of which run on the server.
// The virtual module is a stub when solid-repl isn't installed (see ../repl.ts).
const ReplClient = clientOnly(
	() => import("virtual:solidbase/default-theme/repl-client"),
);

export function Repl(props: ReplProps) {
	const text = useThemeText();
	const loading = () => <div class={styles.loading}>{text.replLoading}</div>;

	return (
		<div
			class={`${styles.repl} ${SOLID_REPL_ROOT_CLASS}`}
			style={{ height: props.height }}
		>
			<Errored
				fallback={(error) => {
					console.error(error());
					return <div class={styles.loading}>{text.replError}</div>;
				}}
			>
				<Loading fallback={loading()}>
					{/* ReplClient takes its tabs once at setup, so mount it with resolved tabs and remount when they change. */}
					<Show when={props.tabs} keyed>
						{(tabs) => (
							<ReplClient {...props} tabs={tabs} fallback={loading()} />
						)}
					</Show>
				</Loading>
			</Errored>
		</div>
	);
}
