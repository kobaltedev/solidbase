import type { DefaultThemeConfig } from ".";
import { useRouteSolidBaseConfig as _useRouteConfig } from "../client/config";
import { useSolidBaseContext as _useSolidBaseContext } from "../client/context";
import { useFrontmatter } from "../client/page-data";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}

export function useDefaultThemeFrontmatter() {
	const frontmatter = useFrontmatter<DefaultThemeConfig>();
}
