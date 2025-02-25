import { createContextProvider } from "@solid-primitives/context";
import { createSignal } from "solid-js";

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

import { useDefaultThemeFrontmatter } from "./frontmatter";

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

const [DefaultThemeComponentsProvider, useDefaultThemeComponentsContext] =
	createContextProvider((props: { components?: Partial<ThemeComponents> }) => {
		const parent = useDefaultThemeComponentsContext() as any;
		return {
			...defaultComponents,
			...parent,
			...props.components,
		} as ThemeComponents;
	});

export function useDefaultThemeComponents() {
	return (
		useDefaultThemeComponentsContext() ??
		(() => {
			throw new Error(
				"useDefaultThemeComponents must be used within a DefaultThemeComponentsContextProvider",
			);
		})()
	);
}

const [DefaultThemeStateProvider, useDefaultThemeStateContext] =
	createContextProvider(() => {
		const [sidebarOpen, setSidebarOpen] = createSignal(false);
		const [tocOpen, setTocOpen] = createSignal(false);
		const frontmatter = useDefaultThemeFrontmatter();

		return { sidebarOpen, setSidebarOpen, tocOpen, setTocOpen, frontmatter };
	});

export function useDefaultThemeState() {
	return (
		useDefaultThemeStateContext() ??
		(() => {
			throw new Error(
				"useDefaultThemeContext must be used within a DefaultThemeContextProvider",
			);
		})()
	);
}

export { DefaultThemeComponentsProvider, DefaultThemeStateProvider };
