import { createContextProvider } from "@solid-primitives/context";
import { createSignal } from "solid-js";

import type { ThemeComponents } from "./default-components.js";
import { useDefaultThemeFrontmatter } from "./frontmatter.js";

const [DefaultThemeComponentsProvider, useDefaultThemeComponentsContext] =
	createContextProvider(
		(props: { components?: Partial<ThemeComponents>; force?: boolean }) => {
			const parent = useDefaultThemeComponentsContext() as any;
			if (parent.force)
				return {
					...props.components,
					...parent.components,
				} as ThemeComponents;

			return {
				...parent.components,
				...props.components,
			} as ThemeComponents;
		},
	);

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
