import {
	useRouteSolidBaseConfig as _useRouteConfig,
	useSolidBaseContext as _useSolidBaseContext,
} from "../client";
import type { DefaultThemeConfig } from ".";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}
