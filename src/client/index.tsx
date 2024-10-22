import {
	type BaseRouterProps,
	type RouteSectionProps,
	Router,
} from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { type JSX, Show, Suspense, children, createEffect } from "solid-js";
import { Dynamic } from "solid-js/web";

import { SolidBaseProvider, useSolidBaseContext } from "./context";

import "./index.css";
import { getRawTheme, getTheme } from "./theme";

interface SolidBaseAppProps {
	root?: BaseRouterProps["root"];
	children?: BaseRouterProps["children"];
}

export function SolidBaseApp(props: SolidBaseAppProps) {
	const resolved = children(() => {
		return props.children as unknown as JSX.Element;
	});

	return (
		<Router
			root={(rootProps) => (
				<SolidBaseProvider>
					<Show when={props.root} fallback={<Layout {...rootProps} />}>
						<Dynamic component={props.root} {...rootProps}>
							<Layout {...rootProps} />
						</Dynamic>
					</Show>
				</SolidBaseProvider>
			)}
		>
			<Show when={resolved()} fallback={<FileRoutes />}>
				{resolved()}
			</Show>
		</Router>
	);
}

function Layout(rootProps: RouteSectionProps) {
	const { Layout } = useSolidBaseContext().components;

	createEffect(() => {
		document.documentElement.setAttribute("data-theme", getTheme());
		document.cookie = `theme=${getRawTheme()}; max-age=31536000; path=/`;
	});

	return (
		<Suspense>
			<Layout>{rootProps.children}</Layout>
		</Suspense>
	);
}

export function SolidBaseServerScript() {
	return (
		<script>
			{`
				function getThemeCookie() {
					if (!document.cookie) return undefined;
					const match = document.cookie.match(new RegExp(\`\\\\W?theme=(?<theme>\\\\w+)\`));
					return match?.groups?.theme;
				}

				document.documentElement.setAttribute("data-theme", getThemeCookie().replace("s", "") ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
			`}
		</script>
	);
}

export { getTheme, setTheme } from "./theme";
export { getLocale, useLocale } from "./locale";
