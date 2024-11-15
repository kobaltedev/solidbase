import { createContextProvider } from "@solid-primitives/context";
import {
	type ParentProps,
	createContext,
	createSignal,
	useContext,
} from "solid-js";

import Article from "./components/Article";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import LastUpdated from "./components/LastUpdated";
import Link from "./components/Link";
import LocaleSelector from "./components/LocaleSelector";
import TableOfContents from "./components/TableOfContents";
import ThemeSelector from "./components/ThemeSelector";

const defaultComponents = {
	Article,
	Footer,
	Header,
	LastUpdated,
	Link,
	LocaleSelector,
	TableOfContents,
	ThemeSelector,
	Hero,
	Features,
};

export type ThemeComponents = typeof defaultComponents;

const ComponentsContext = createContext<ThemeComponents>(defaultComponents);

export function ComponentsProvider(
	props: ParentProps & { components?: Partial<ThemeComponents> },
) {
	return (
		<ComponentsContext.Provider
			value={{ ...defaultComponents, ...props.components }}
		>
			{props.children}
		</ComponentsContext.Provider>
	);
}

export const useThemeComponents = () => useContext(ComponentsContext);

export const [DefaultThemeContextProvider, useDefaultThemeContext] =
	createContextProvider(() => {
		const [sidebarOpen, setSidebarOpen] = createSignal(false);
		const [tocOpen, setTocOpen] = createSignal(false);

		return { sidebarOpen, setSidebarOpen, tocOpen, setTocOpen };
	}, null!);
