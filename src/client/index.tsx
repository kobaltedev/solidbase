export { mdxComponents } from "virtual:solidbase/components";
export { useRouteSolidBaseConfig } from "./config";
export { useSolidBaseContext } from "./context";
export {
	getLocale,
	getLocaleLink,
	type ResolvedLocale,
	useLocale,
} from "./locale";
export {
	type BaseFrontmatter,
	type TableOfContentsItemData,
	useCurrentPageData,
	useFrontmatter,
} from "./page-data";
export { SolidBaseRoot } from "./Root";
export type * from "./sidebar";
export { SidebarProvider, usePrevNext, useSidebar } from "./sidebar";
export {
	getTheme,
	getThemeVariant,
	setTheme,
	type ThemeType,
	useThemeListener,
} from "./theme";
