import { pageRoutes } from "virtual:file-routes";
import { SolidBaseRoot } from "@kobalte/solidbase/client";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";

const Router = createRouter({
	routes: fileRoutes(pageRoutes),
	base: import.meta.env.BASE_URL,
});

export default function App() {
	return (
		<Router>
			{(props) => <SolidBaseRoot>{props.children}</SolidBaseRoot>}
		</Router>
	);
}
