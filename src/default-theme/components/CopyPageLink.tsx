import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import {
	type CopyPageState,
	useCopyPageMarkdown,
} from "../../client/index.jsx";
import { useThemeText } from "../utils.js";
import styles from "./CopyPageLink.module.css";
import Check from "~icons/ri/check-line";
import CrossIcon from "~icons/ri/close-circle-line";
import CopyIcon from "~icons/ri/copy-line";

function getStateIcon(state: CopyPageState) {
	switch (state) {
		case "success":
			return Check;
		case "error":
			return CrossIcon;
		default:
			return CopyIcon;
	}
}

export default function CopyPageLink() {
	const text = useThemeText();
	const { canCopy, copy, isCopying, isReady, state } = useCopyPageMarkdown();

	return (
		<Show when={canCopy()}>
			<button
				type="button"
				class={styles.button}
				classList={{
					[styles.success]: state() === "success",
					[styles.error]: state() === "error",
				}}
				onClick={copy}
				disabled={!isReady() || import.meta.env.DEV}
				aria-busy={isCopying() || undefined}
				aria-live="polite"
			>
				<Dynamic component={getStateIcon(state())} class={styles.icon} />
				<span class={styles.labelWrap}>
					<span
						class={styles.label}
						classList={{ [styles.active]: state() === "idle" }}
					>
						{text.copyPage}
					</span>
					<span
						class={styles.label}
						classList={{ [styles.active]: state() === "success" }}
					>
						{text.copiedPage}
					</span>
					<span
						class={styles.label}
						classList={{ [styles.active]: state() === "error" }}
					>
						{text.copyFailedPage}
					</span>
				</span>
			</button>
		</Show>
	);
}
