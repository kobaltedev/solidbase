import type { ParentProps } from "solid-js";

export default function Header(props: ParentProps<{}>) {
	return (
		<header>
			<p>Internal</p>
			{props.children}
		</header>
	);
}
