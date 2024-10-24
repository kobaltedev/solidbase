import {
	type ComponentProps,
	type ParentProps,
	Show,
	splitProps,
} from "solid-js";
import styles from "./mdx-components.module.css";

export function h1(props: ComponentProps<"h1">) {
	return <h1 class={styles.h1} {...props} />;
}

export function h2(props: ComponentProps<"h2">) {
	return <h2 class={styles.h2} {...props} />;
}

export function h3(props: ComponentProps<"h3">) {
	return <h3 class={styles.h3} {...props} />;
}

export function h4(props: ComponentProps<"h4">) {
	return <h4 class={styles.h4} {...props} />;
}

export function h5(props: ComponentProps<"h5">) {
	return <h5 class={styles.h5} {...props} />;
}

export function h6(props: ComponentProps<"h6">) {
	return <h6 class={styles.h6} {...props} />;
}

export function a(props: ComponentProps<"a"> & { "data-auto-heading"?: "" }) {
	const outbound = () => (props.href ?? "").includes("://");
	const autoHeading = () => props["data-auto-heading"] === "";

	return (
		<a
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			class={autoHeading() ? styles["a-auto"] : styles.a}
			{...props}
		/>
	);
}

export function code(props: ComponentProps<"code">) {
	return <code class={styles.code} {...props} />;
}

export function hr(props: ComponentProps<"hr">) {
	return <hr class={styles.hr} {...props} />;
}

export function table(props: ComponentProps<"table">) {
	const [local, others] = splitProps(props, ["class"]);

	return (
		<div class={styles.table}>
			<table {...others} />
		</div>
	);
}

export function blockquote(props: ComponentProps<"blockquote">) {
	return <blockquote class={styles.blockquote} {...props} />;
}

export function p(props: ComponentProps<"p">) {
	return <p class={styles.p} {...props} />;
}

export function li(props: ComponentProps<"li">) {
	return <li class={styles.li} {...props} />;
}

export function ul(props: ComponentProps<"ul">) {
	return <ul class={styles.ul} {...props} />;
}

export function ol(props: ComponentProps<"ol">) {
	return <ol class={styles.ol} {...props} />;
}

export function CustomContainer(
	props: {
		type:
			| "info"
			| "note"
			| "tip"
			| "important"
			| "warning"
			| "danger"
			| "caution"
			| "details";
		title?: string;
	} & ParentProps,
) {
	if (props.type === "details") {
		return (
			<details
				class={styles["custom-container"]}
				data-custom-container="details"
			>
				<summary>{props.title ?? props.type}</summary>
				{props.children}
			</details>
		);
	}

	return (
		<div class={styles["custom-container"]} data-custom-container={props.type}>
			<Show when={props.title !== "_"}>
				<span>{props.title ?? props.type}</span>
			</Show>
			{props.children}
		</div>
	);
}
