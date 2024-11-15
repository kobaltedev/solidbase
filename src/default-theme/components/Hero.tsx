import { For, Show } from "solid-js";
import { useCurrentPageData } from "../../client";
import styles from "./Hero.module.css";

export default function Hero() {
	const pageData = useCurrentPageData();

	const hero = () => pageData().frontmatter.hero!;

	return (
		<div class={styles.hero}>
			<div>
				<h1>{hero().name ?? pageData().frontmatter.title}</h1>
				<Show when={hero().text}>
					<p>{hero().text}</p>
				</Show>
				<Show when={hero().tagline}>
					<p class={styles.tagline}>{hero().tagline}</p>
				</Show>

				<Show when={hero().actions}>
					<div class={styles.actions}>
						<For each={hero().actions!}>
							{(action) => (
								<a
									class={`${styles.action} ${action.theme ?? "brand"}`}
									href={action.link}
									target={
										action.link!.startsWith("http") ? "_blank" : undefined
									}
								>
									{action.text}
								</a>
							)}
						</For>
					</div>
				</Show>
			</div>
			<Show when={hero().image}>
				<div class={styles.image}>
					<div class={styles["image-bg"]} />
					<img
						src={hero().image!.src}
						alt={hero().image?.alt}
						role={!hero().image?.alt ? "presentation" : undefined}
					/>
				</div>
			</Show>
		</div>
	);
}
