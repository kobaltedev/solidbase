import type { DefaultThemeConfig } from ".";
import { useRouteSolidBaseConfig as _useRouteConfig } from "../client/config";
import { useSolidBaseContext as _useSolidBaseContext } from "../client/context";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}
