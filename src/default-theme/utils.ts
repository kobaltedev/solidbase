import type { DefaultThemeConfig } from ".";
import {
	useRouteSolidBaseConfig as _useRouteConfig,
	useSolidBaseContext as _useSolidBaseContext,
} from "../client";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}
