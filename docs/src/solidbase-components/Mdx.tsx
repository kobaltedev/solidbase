import type { ComponentProps } from "solid-js";

export function h1(props: ComponentProps<"h1">) {
	return <h1 {...props} style={{ color: "red" }} />;
}
