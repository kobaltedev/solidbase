import {
	type BaseRouterProps,
	type RouteSectionProps,
	Router,
} from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { type JSX, Show, Suspense, children, onMount } from "solid-js";
import { SolidBaseProvider, useSolidBaseContext } from "./context";

interface SolidBaseAppProps {
	root?: BaseRouterProps["root"];
	children?: BaseRouterProps["children"];
}

export function SolidBaseApp(props: SolidBaseAppProps) {
	const resolved = children(() => {
		return props.children as unknown as JSX.Element;
	});

	onMount(() => {
		document.documentElement.setAttribute("data-theme", "dark");
	});

	return (
		<SolidBaseProvider>
			<Router
				root={(rootProps) => (
					<Show when={props.root} fallback={<Layout {...rootProps} />}>
						{props.root?.({
							...rootProps,
							children: <Layout {...rootProps} />,
						})}
					</Show>
				)}
			>
				<Show when={resolved()} fallback={<FileRoutes />}>
					{resolved()}
				</Show>
			</Router>
		</SolidBaseProvider>
	);
}

function Layout(rootProps: RouteSectionProps) {
	const { Layout } = useSolidBaseContext().components;

	return (
		<Suspense>
			<Layout>{rootProps.children}</Layout>
		</Suspense>
	);
}
