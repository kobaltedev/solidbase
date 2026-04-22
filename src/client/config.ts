import { solidBaseConfig } from "virtual:solidbase/config";
import { type Accessor, createMemo } from "solid-js";

import type { SolidBaseResolvedConfig } from "../config/index.js";
import { resolveSolidBaseRouteConfig } from "../config/route-config.js";
import { useLocale } from "./locale.js";
import { useSolidBaseRoute } from "./routes.js";

export function useRouteSolidBaseConfig<ThemeConfig>(): Accessor<
	SolidBaseResolvedConfig<ThemeConfig>
> {
	const { currentLocale } = useLocale();
	const currentRoute = useSolidBaseRoute();

	return createMemo(() => {
		const routeConfig = resolveSolidBaseRouteConfig(
			solidBaseConfig,
			currentRoute(),
		);
		const localeConfig = currentLocale().config.themeConfig ?? {};

		return {
			...routeConfig,
			themeConfig: { ...routeConfig.themeConfig, ...localeConfig },
		};
	});
}
