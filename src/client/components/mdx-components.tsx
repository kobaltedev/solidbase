import { type ComponentProps, type ParentProps, splitProps } from "solid-js";
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

export function table(props: ComponentProps<"table">) {
	const [local, others] = splitProps(props, ["class"]);

	return (
		<div style={{ "overflow-x": "auto" }}>
			<table class="" {...others} />
		</div>
	);
}

export function blockquote(props: ComponentProps<"blockquote">) {
	return <blockquote {...props} style={{ background: "aquamarine" }} />;
}

export function p(props: ComponentProps<"p">) {
	return <p {...props} style={{ color: "green" }} />;
}

export function li(props: ComponentProps<"li">) {
	return <li {...props} style={{ color: "green" }} />;
}

export function ul(props: ComponentProps<"ul">) {
	return <ul {...props} style={{ background: "lime" }} />;
}

export function ol(props: ComponentProps<"ol"> & { "data-toc"?: "" }) {
	if (props["data-toc"] === "")
		return <ol {...props} style={{ background: "darkseagreen" }} />;

	return <ol {...props} style={{ background: "aquamarine" }} />;
}

const customContainerColors = {
	info: "lightgray",
	tip: "lightgreen",
	important: "violet",
	warning: "lightyellow",
	danger: "lightcoral",
	details: "lightgray",
};

export function CustomContainer(
	props: {
		type: "info" | "tip" | "important" | "warning" | "danger" | "details";
		title?: string;
	} & ParentProps,
) {
	return (
		<div
			data-custom-container={props.type}
			style={{
				"background-color": customContainerColors[props.type],
				padding: "0.5rem",
			}}
		>
			<span style={{ "text-transform": "uppercase" }}>
				{props.title ?? props.type}
			</span>
			{props.children}
		</div>
	);
}
