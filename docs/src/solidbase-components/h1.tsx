import type { ComponentProps } from "solid-js";

export default function (props: ComponentProps<"h1">) {
  return <h1 {...props} style={{ color: "green" }} />;
}
