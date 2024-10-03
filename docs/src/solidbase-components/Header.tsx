import type { ParentProps } from "solid-js";

export default function Header(props: ParentProps<{}>) {
  return (
    <header style={{ "border-bottom": "1px solid gray" }}>
      <p>Override</p>
      {props.children}
    </header>
  );
}
