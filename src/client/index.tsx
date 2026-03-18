export { mdxComponents } from "virtual:solidbase/components";
export { useRouteSolidBaseConfig } from "./config.js";
export { useSolidBaseContext } from "./context.jsx";
export {
	getLocale,
	getLocaleLink,
	type ResolvedLocale,
	useLocale,
} from "./locale.js";
export {
	type BaseFrontmatter,
	type TableOfContentsItemData,
	useCurrentPageData,
	useFrontmatter,
} from "./page-data.js";
export { usePreferredLanguage } from "./preferred-language.js";
export { SolidBaseRoot } from "./Root.jsx";
export type * from "./sidebar.js";
export { SidebarProvider, usePrevNext, useSidebar } from "./sidebar.js";
export {
	getTheme,
	getThemeVariant,
	setTheme,
	type ThemeType,
	useThemeListener,
} from "./theme.js";
