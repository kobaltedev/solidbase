import { dynamic } from "@solidjs/web";
import { Show } from "solid-js";
import Check from "~icons/ri/check-fill";
import CrossIcon from "~icons/ri/close-circle-line";
import CopyIcon from "~icons/ri/file-copy-line";
import {
	type CopyPageState,
	useCopyPageMarkdown,
} from "../../client/index.jsx";
import { useThemeText } from "../utils.js";
import styles from "./CopyPageLink.module.css";

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
	const StateIcon = dynamic(() => getStateIcon(state()));

	return (
		<Show when={canCopy()}>
			<button
				type="button"
				class={[
					styles.button,
					{
						[styles.success!]: state() === "success",
						[styles.error!]: state() === "error",
					},
				]}
				onClick={copy}
				disabled={!isReady() || import.meta.env.DEV}
				aria-busy={isCopying() ? "true" : undefined}
				aria-live="polite"
			>
				<StateIcon class={styles.icon} />
				<span class={styles.labelWrap}>
					<span
						class={[styles.label, { [styles.active!]: state() === "idle" }]}
					>
						{text.copyPage}
					</span>
					<span
						class={[styles.label, { [styles.active!]: state() === "success" }]}
					>
						{text.copiedPage}
					</span>
					<span
						class={[styles.label, { [styles.active!]: state() === "error" }]}
					>
						{text.copyFailedPage}
					</span>
				</span>
			</button>
		</Show>
	);
}
