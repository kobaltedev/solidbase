import {
	type ParentComponent,
	type ParentProps,
	createContext,
	useContext,
} from "solid-js";
import { MDXProvider } from "solid-mdx";

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
