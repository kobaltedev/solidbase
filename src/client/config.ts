import { solidBaseConfig } from "virtual:solidbase";
import { type Accessor, createMemo } from "solid-js";

import type { SolidBaseResolvedConfig } from "../config";
import { useLocale } from "./locale";

export function useRouteConfig(): Accessor<SolidBaseResolvedConfig> {
	const { currentLocale } = useLocale();

	return createMemo(() => {
		const localeConfig = currentLocale().config.config ?? {};

		return { ...solidBaseConfig, ...localeConfig };
	});
}
