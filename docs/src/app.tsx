import { SolidBaseApp } from "@kobalte/solidbase/client";
import { Title } from "@solidjs/meta";

import "./app.css";

export default function App() {
	return (
		<SolidBaseApp
		//					root={(props) => (
		//						<>
		//							<Title>I am the captain now</Title>
		//							{props.children}
		//						</>
		//					)} // broken
		/>
	);
}
