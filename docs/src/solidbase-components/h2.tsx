import type { ComponentProps } from "solid-js";

export default function (props: ComponentProps<"h1">) {
  return <h2 {...props} style={{ color: "red" }} />;
}
