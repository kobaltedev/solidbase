import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import {
	type CopyPageState,
	useCopyPageMarkdown,
} from "../../client/index.jsx";
import { useThemeText } from "../utils.js";
import styles from "./CopyPageLink.module.css";
import { CheckIcon, CopyIcon, CrossIcon } from "./icons.jsx";

function getStateIcon(state: CopyPageState) {
	switch (state) {
		case "success":
			return CheckIcon;
		case "error":
			return CrossIcon;
		default:
			return CopyIcon;
	}
}

export default function CopyPageLink() {
	const text = useThemeText();
	const { canCopy, copy, isCopying, state } = useCopyPageMarkdown();

	function label() {
		switch (state()) {
			case "success":
				return text.copiedPage;
			case "error":
				return text.copyFailedPage;
			default:
				return text.copyPage;
		}
	}

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
				disabled={isCopying()}
				aria-live="polite"
			>
				<Dynamic component={getStateIcon(state())} class={styles.icon} />
				<span>{label()}</span>
			</button>
		</Show>
	);
}
