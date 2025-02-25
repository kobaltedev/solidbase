import { For, Show } from "solid-js";

import type { FeaturesConfig } from "../frontmatter";

import styles from "./Features.module.css";

export default function Features(props: { features: FeaturesConfig[] }) {
	return (
		<div class={styles.features}>
			<For each={props.features}>
				{(feature) => (
					<div class={styles.feature}>
						<Show when={feature.icon}>
							<div
								role="presentation"
								class={styles.icon}
								innerHTML={feature.icon}
							/>
						</Show>
						<h2 class={styles.title}>{feature.title}</h2>
						<p>{feature.details}</p>
					</div>
				)}
			</For>
		</div>
	);
}
