import { SolidBase, SolidBaseLayout } from "@kobalte/solidbase/client";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
	return (
		<SolidBase>
			<Router
				root={(props) => (
					<Suspense>
						<SolidBaseLayout>{props.children}</SolidBaseLayout>
					</Suspense>
				)}
			>
				<FileRoutes />
			</Router>
		</SolidBase>
	);
}
