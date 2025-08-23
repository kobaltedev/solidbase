import type { DefaultThemeConfig } from "./index.js";
import {
	useRouteSolidBaseConfig as _useRouteConfig,
	useSolidBaseContext as _useSolidBaseContext,
} from "../client/index.jsx";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}
