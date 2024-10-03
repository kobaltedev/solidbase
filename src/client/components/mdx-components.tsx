import { Button } from "@kobalte/core/button";
import { writeClipboard } from "@solid-primitives/clipboard";
import { type ComponentProps, Show, createSignal, splitProps } from "solid-js";
import { CheckIcon, CopyIcon } from "./icons";

export function h1(props: ComponentProps<"h1">) {
	return <h1 {...props} style={{ color: "green" }} />;
}

export function h2(props: ComponentProps<"h2">) {
	return <h2 {...props} style={{ color: "green" }} />;
}

export function h3(props: ComponentProps<"h3">) {
	return <h3 {...props} style={{ color: "green" }} />;
}

export function h4(props: ComponentProps<"h4">) {
	return <h4 {...props} style={{ color: "green" }} />;
}

export function h5(props: ComponentProps<"h5">) {
	return <h4 {...props} style={{ color: "green" }} />;
}

export function h6(props: ComponentProps<"h6">) {
	return <h4 {...props} style={{ color: "green" }} />;
}

export function a(props: ComponentProps<"a"> & { "data-auto-heading"?: "" }) {
	const outbound = () => (props.href ?? "").includes("://");
	const autoHeading = () => props["data-auto-heading"] === "";

	return (
		<a
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			style={{
				color: autoHeading() ? "inherit" : undefined,
			}}
			{...props}
		/>
	);
}

export function code(props: ComponentProps<"code">) {
	return <code class={""} {...props} />;
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
	return <blockquote {...props} style={{ color: "green" }} />;
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
