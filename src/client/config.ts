import { solidBaseConfig } from "virtual:solidbase/config";
import { type Accessor, createMemo } from "solid-js";

import type { SolidBaseResolvedConfig } from "../config";
import { useLocale } from "./locale";

export function useRouteConfig<ThemeConfig>(): Accessor<
	SolidBaseResolvedConfig<ThemeConfig>
> {
	const { currentLocale } = useLocale();

	return createMemo(() => {
		const localeConfig = currentLocale().config.themeConfig ?? {};

		return {
			...solidBaseConfig,
			themeConfig: { ...solidBaseConfig.themeConfig, ...localeConfig },
		};
	});
}
