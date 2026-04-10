import {
	useRouteSolidBaseConfig as _useRouteConfig,
	useSolidBaseContext as _useSolidBaseContext,
} from "../client/index.jsx";
import type { DefaultThemeConfig } from "./index.js";
import { defaultThemeTextConfig } from "./text.js";

export function useSolidBaseContext() {
	return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
	return _useRouteConfig<DefaultThemeConfig>();
}

export function useThemeText() {
	const config = useRouteConfig();

	return {
		...defaultThemeTextConfig,
		...config().themeConfig?.text,
	};
}
