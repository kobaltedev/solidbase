import { SolidBaseLayout, SolidBaseProvider } from "@kobalte/solidbase/client";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
	return (
		<SolidBaseProvider>
			<Router
				root={(props) => {
					return (
						<SolidBaseLayout>
							<Suspense>{props.children}</Suspense>
						</SolidBaseLayout>
					);
				}}
			>
				<FileRoutes />
			</Router>
		</SolidBaseProvider>
	);
}
