import { For, Show } from "solid-js";
import { useCurrentPageData } from "../../client";
import styles from "./Features.module.css";

export default function Features() {
	const pageData = useCurrentPageData();

	const features = () => pageData().frontmatter.features!;

	return (
		<div class={styles.features}>
			<For each={features()}>
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
