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

export function SolidBase(props: ParentProps) {
	return (
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
	);
}

export function SolidBaseLayout(props: ParentProps) {
	const { Header } = useSolidBaseContext().components;

	return (
		<>
			<Header>inside header</Header>

			{props.children}
		</>
	);
}
