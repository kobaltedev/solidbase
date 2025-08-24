export {
	getTheme,
	setTheme,
	getThemeVariant,
	useThemeListener,
	type ThemeType,
} from "./theme.js";
export {
	getLocale,
	useLocale,
	getLocaleLink,
	type ResolvedLocale,
} from "./locale.js";
export { SolidBaseRoot } from "./Root.jsx";
export {
	useCurrentPageData,
	useFrontmatter,
	type BaseFrontmatter,
	type TableOfContentsItemData,
} from "./page-data.js";
export { useSolidBaseContext } from "./context.jsx";
export { useRouteSolidBaseConfig } from "./config.js";

export { SidebarProvider, useSidebar, usePrevNext } from "./sidebar.js";
export type * from "./sidebar.js";

export { mdxComponents } from "virtual:solidbase/components";
