import type { ComponentProps } from "@solidjs/web";

export function h1(props: ComponentProps<"h1">) {
	return <h1 {...props} style={{ color: "red" }} />;
}
