import { SolidBaseRoot } from "@kobalte/solidbase/client";
import { Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

import "./app.css";

export default function App() {
	return (
		<Router
			root={(props) => (
				<SolidBaseRoot {...props}>
					{props.children}
					<Title>I am the captain now</Title>
				</SolidBaseRoot>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
