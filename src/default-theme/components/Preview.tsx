import type { ParentProps } from "solid-js";

import styles from "../mdx-components.module.css";

export function Preview(props: ParentProps) {
	return (
		<div class={styles.preview} data-preview-root>
			{props.children}
		</div>
	);
}

export function PreviewStage(props: ParentProps) {
	return (
		<div class={styles["preview-stage"]} data-preview-stage>
			<div class={styles["preview-stage-inner"]}>{props.children}</div>
		</div>
	);
}

export function PreviewPanel(props: ParentProps) {
	return (
		<div class={styles["preview-panel"]} data-preview-panel>
			{props.children}
		</div>
	);
}
