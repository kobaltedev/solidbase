import {
	Component,
	ComponentProps,
	JSX,
	type ParentComponent,
	type ParentProps,
	Show,
	Suspense,
	children,
	createContext,
	useContext,
} from "solid-js";
import { MDXProvider } from "solid-mdx";
import { FileRoutes } from "@solidjs/start/router";

// @ts-ignore
import { overrideMdxComponents, solidBaseComponents } from "virtual:solidbase";

import Header from "./components/Header";
import * as mdxComponents from "./components/mdx-components";

interface SolidBaseContextValue {
	components: {
		Header: ParentComponent<{}>;
	};
}

const SolidBaseContext = createContext<SolidBaseContextValue>();

export function useSolidBaseContext() {
	const context = useContext(SolidBaseContext);

	if (context === undefined) {
		throw new Error(
			"[SolidBase]: `useSolidBaseContext` must be used within a `SolidBase` component",
		);
	}

	return context;
}

export function SolidBaseProvider(props: ParentProps) {
	return (
		<MetaProvider>
			<MDXProvider
				components={{
					...mdxComponents,
					...overrideMdxComponents,
				}}
			>
				<SolidBaseContext.Provider
					value={{
						components: {
							Header,
							...solidBaseComponents,
						},
					}}
				>
					{props.children}
				</SolidBaseContext.Provider>
			</MDXProvider>
		</MetaProvider>
	);
}

import { MetaProvider, Title } from "@solidjs/meta";
import { useCurrentFrontmatter } from "./frontmatter";
import { BaseRouterProps, Router } from "@solidjs/router";

export function SolidBaseLayout(props: ParentProps) {
	const { Header } = useSolidBaseContext().components;

	const frontmatter = useCurrentFrontmatter();

	return (
		<>
			<Header>inside header</Header>
			<Title>{frontmatter()?.title ?? ""}</Title>

			{props.children}
		</>
	);
}

type RootProps = ComponentProps<NonNullable<BaseRouterProps["root"]>>;
interface AppRootProps extends RootProps {
	layout?: LayoutComponent;
}
function AppRoot(props: AppRootProps) {
	const frontmatter = useCurrentFrontmatter();
	const resolved = children(() => props.children);
	return (
		<Show
			when={!props.layout}
			fallback={props.layout?.({
				frontmatter: frontmatter(),
				children: resolved(),
			})}
		>
			<SolidBaseLayout>
				<Suspense>{resolved()}</Suspense>
			</SolidBaseLayout>
		</Show>
	);
}

interface LayoutOptions {
	frontmatter?: Record<string, string>;
	children?: JSX.Element;
}

type LayoutComponent = Component<LayoutOptions>;

interface SolidBaseAppProps {
	root?: BaseRouterProps["root"];
	layout?: LayoutComponent;
	children?: BaseRouterProps["children"];
}

export function SolidBaseApp(props: SolidBaseAppProps) {
	const resolved = children(() => {
		return props.children as unknown as JSX.Element;
	});

	return (
		<SolidBaseProvider>
			<Router
				root={(rootProps) => (
					<Show
						when={props.root}
						fallback={
							<Suspense>
								<AppRoot {...rootProps} layout={props.layout} />
							</Suspense>
						}
					>
						{props.root?.(rootProps)}
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
