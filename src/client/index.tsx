export {
	getTheme,
	setTheme,
	getThemeVariant,
	useThemeListener,
	type ThemeType,
} from "./theme";
export {
	getLocale,
	useLocale,
	getLocaleLink,
	type ResolvedLocale,
} from "./locale";
export { usePreferredLanguage } from "./preferred-language";
export { SolidBaseRoot } from "./Root";
export {
	useCurrentPageData,
	useFrontmatter,
	type BaseFrontmatter,
	type TableOfContentsItemData,
} from "./page-data";
export { useSolidBaseContext } from "./context";
export { useRouteSolidBaseConfig } from "./config";

export { SidebarProvider, useSidebar, usePrevNext } from "./sidebar";
export type * from "./sidebar";

export { mdxComponents } from "virtual:solidbase/components";
