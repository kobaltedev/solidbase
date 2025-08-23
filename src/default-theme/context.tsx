import { createContextProvider } from "@solid-primitives/context";
import { createSignal } from "solid-js";

import Article from "./components/Article.jsx";
import Features from "./components/Features.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import LastUpdated from "./components/LastUpdated.jsx";
import Link from "./components/Link.jsx";
import LocaleSelector from "./components/LocaleSelector.jsx";
import TableOfContents from "./components/TableOfContents.jsx";
import ThemeSelector from "./components/ThemeSelector.jsx";

import { useDefaultThemeFrontmatter } from "./frontmatter.js";

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
		const [navOpen, setNavOpen] = createSignal(false);
		const frontmatter = useDefaultThemeFrontmatter();

		return {
			sidebarOpen,
			setSidebarOpen,
			tocOpen,
			setTocOpen,
			navOpen,
			setNavOpen,
			frontmatter,
		};
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
