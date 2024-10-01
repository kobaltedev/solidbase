import type { ParentProps } from "solid-js";

export default function Header(props: ParentProps<{}>) {
	return (
		<header>
			<p>Override</p>
			{props.children}
		</header>
	);
}
