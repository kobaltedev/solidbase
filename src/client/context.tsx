import { type Accessor, createContext, useContext } from "solid-js";

import type { SolidBaseResolvedConfig } from "../config";
import type { useLocale } from "./locale";

export interface SolidBaseContextValue<ThemeConfig> {
	config: Accessor<SolidBaseResolvedConfig<ThemeConfig>>;
	locale: ReturnType<typeof useLocale>;
	title: Accessor<string>;
}

export const SolidBaseContext = createContext<SolidBaseContextValue<any>>();

export function useSolidBaseContext<ThemeConfig>() {
	const context = useContext(SolidBaseContext);

	if (context === undefined) {
		if (import.meta.env.VITE_SOLIDBASE_DEV) location.reload();
		throw new Error(
			"[SolidBase]: `useSolidBaseContext` must be used within a `SolidBase` component",
		);
	}

	return context as SolidBaseContextValue<ThemeConfig>;
}
