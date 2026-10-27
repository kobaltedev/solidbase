import { pageRoutes } from "virtual:file-routes";
import { SolidBaseRoot } from "@kobalte/solidbase/client";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";

const Router = createRouter({
	routes: fileRoutes(pageRoutes),
	// Vite's base ends with a slash ("/docs/"), which the router would keep when
	// resolving links ("/docs//guide"), so pass it without one.
	base: import.meta.env.BASE_URL.replace(/\/$/, ""),
});

export default function App() {
	return (
		<Router>
			{(props) => <SolidBaseRoot>{props.children}</SolidBaseRoot>}
		</Router>
	);
}
