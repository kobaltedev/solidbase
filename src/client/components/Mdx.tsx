import type { ComponentProps } from "solid-js";

export function h1(props: ComponentProps<"h1">) {
	return <h1 {...props} style={{ color: "green" }} />;
}

export function h2(props: ComponentProps<"h2">) {
	return <h2 {...props} style={{ color: "green" }} />;
}
