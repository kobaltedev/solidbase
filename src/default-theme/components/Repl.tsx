import { clientOnly } from "@solidjs/start";
import { ErrorBoundary } from "solid-js";
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

	return (
		<div
			class={`${styles.repl} ${SOLID_REPL_ROOT_CLASS}`}
			style={{ height: props.height }}
		>
			<ErrorBoundary
				fallback={(error) => {
					console.error(error);
					return <div class={styles.loading}>{text.replError}</div>;
				}}
			>
				<ReplClient
					{...props}
					fallback={<div class={styles.loading}>{text.replLoading}</div>}
				/>
			</ErrorBoundary>
		</div>
	);
}
