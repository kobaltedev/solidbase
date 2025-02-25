import { Title } from "@solidjs/meta";
import type { RouteSectionProps } from "@solidjs/router";

import Layout from "@kobalte/solidbase/default-theme/Layout.jsx";

export default function (props: RouteSectionProps) {
	return (
		<>
			<Title>I am the captain now</Title>
			<Layout {...props} />
		</>
	);
}
