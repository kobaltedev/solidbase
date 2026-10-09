import {
	createContextProvider,
	createLayeredContext,
} from "@solid-primitives/context";
import { createSignal } from "solid-js";

import type { ThemeComponents } from "./default-components.js";
import { useDefaultThemeFrontmatter } from "./frontmatter.js";

// Nested providers merge over their parent. Solid 2's context read throws without a provider,
// so the outermost layer starts from this sentinel instead of reading its own (absent) context.
const ROOT_COMPONENTS = {
	$$SolidBase_force: false,
} as unknown as ThemeComponents;

const [DefaultThemeComponentsProvider, useDefaultThemeComponentsContext] =
	createLayeredContext(
		(
			props: { components?: Partial<ThemeComponents>; force?: boolean },
			parent: ThemeComponents,
		) => {
			if ((parent as any).$$SolidBase_force)
				return {
					...props.components,
					...parent,
					$$SolidBase_force: props.force,
				} as ThemeComponents;

			return {
				...parent,
				...props.components,
				$$SolidBase_force: props.force,
			} as ThemeComponents;
		},
		ROOT_COMPONENTS,
	);

export function useDefaultThemeComponents() {
	const components = useDefaultThemeComponentsContext();
	if (components === ROOT_COMPONENTS) {
		throw new Error(
			"useDefaultThemeComponents must be used within a DefaultThemeComponentsContextProvider",
		);
	}
	return components;
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
