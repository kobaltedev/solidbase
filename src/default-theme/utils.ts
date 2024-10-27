import type { DefaultThemeConfig } from ".";
import { useRouteConfig as _useRouteConfig } from "../client/config";
import { useSolidBaseContext as _useSolidBaseContext } from "../client/context";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}
