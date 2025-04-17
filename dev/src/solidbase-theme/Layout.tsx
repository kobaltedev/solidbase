import { Title } from "@solidjs/meta";

import Layout from "@kobalte/solidbase/default-theme/Layout.jsx";
import type { ParentProps } from "solid-js";

export default function (props: ParentProps) {
	return (
		<>
			<Title>I am the captain now</Title>
			<Layout>{props.children}</Layout>
		</>
	);
}
