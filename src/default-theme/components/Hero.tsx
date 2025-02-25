import { For, Show } from "solid-js";

import { type HeroConfig, useDefaultThemeFrontmatter } from "../frontmatter";

import styles from "./Hero.module.css";

export default function Hero(props: { data: HeroConfig }) {
	const frontmatter = useDefaultThemeFrontmatter();

	const data = () => props.data;

	return (
		<div class={styles.hero}>
			<div>
				<h1>{frontmatter()?.title}</h1>
				<Show when={data().text}>{(t) => <p>{t()}</p>}</Show>
				<Show when={data().tagline}>
					{(t) => <p class={styles.tagline}>{t()}</p>}
				</Show>

				<Show when={data().actions}>
					{(actions) => (
						<div class={styles.actions}>
							<For each={actions()}>
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
					)}
				</Show>
			</div>
			<Show when={data().image}>
				{(image) => (
					<div class={styles.image}>
						<div class={styles["image-bg"]} />
						<img
							src={image().src}
							alt={image().alt}
							role={!image().alt ? "presentation" : undefined}
						/>
					</div>
				)}
			</Show>
		</div>
	);
}
