import { SolidBaseApp } from "@kobalte/solidbase/client";
import { Title } from "@solidjs/meta";

import "./app.css";

export default function App() {
	return (
		<SolidBaseApp
			root={(props) => (
				<>
					{props.children}
					<Title>I am the captain now</Title>
				</>
			)}
		/>
	);
}
