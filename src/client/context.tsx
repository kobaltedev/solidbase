// @ts-ignore
import { overrideMdxComponents, solidBaseComponents } from "virtual:solidbase";
import { MetaProvider } from "@solidjs/meta";
import { type ParentProps, createContext, useContext } from "solid-js";
import { MDXProvider } from "solid-mdx";
import Article from "./components/Article";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LastUpdated from "./components/LastUpdated";
import Layout from "./components/Layout";
import Link from "./components/Link";
import TableOfContents from "./components/TableOfContents";
import ThemeSelector from "./components/ThemeSelector";
import * as mdxComponents from "./components/mdx-components";

export interface SolidBaseContextValue {
	components: {
		Header: typeof Header;
		TableOfContents: typeof TableOfContents;
		Layout: typeof Layout;
		Article: typeof Article;
		Link: typeof Link;
		LastUpdated: typeof LastUpdated;
		Footer: typeof Footer;
		ThemeSelector: typeof ThemeSelector;
	};
}

const SolidBaseContext = createContext<SolidBaseContextValue>();

export function useSolidBaseContext() {
	const context = useContext(SolidBaseContext);

	if (context === undefined) {
		if (import.meta.env.VITE_SOLIDBASE_DEV) location.reload();
		throw new Error(
			"[SolidBase]: `useSolidBaseContext` must be used within a `SolidBase` component",
		);
	}

	return context;
}

function renameCustomMdxComponents(components: Record<string, any>) {
	for (const name of Object.keys(components)) {
		if (name[0].toUpperCase() === name[0]) {
			components[`$$solidbase_${name.toLowerCase()}`] = components[name];
			components[name] = undefined;
		}
	}
	return components;
}

export function SolidBaseProvider(props: ParentProps) {
	return (
		<MetaProvider>
			<MDXProvider
				components={renameCustomMdxComponents({
					...mdxComponents,
					...(overrideMdxComponents ?? {}),
				})}
			>
				<SolidBaseContext.Provider
					value={{
						components: {
							Header,
							TableOfContents,
							Layout,
							Article,
							Link,
							LastUpdated,
							Footer,
							ThemeSelector,
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
