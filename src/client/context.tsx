import { type Accessor, createContext, useContext } from "solid-js";

import type { SolidBaseResolvedConfig } from "../config/index.js";

export interface SolidBaseContextValue<ThemeConfig> {
	config: Accessor<SolidBaseResolvedConfig<ThemeConfig>>;
	metaTitle: Accessor<string>;
}

// A null default: Solid 2 throws on reading a context created without a default, which
// would skip the diagnostic (and the dev reload) below.
export const SolidBaseContext =
	createContext<SolidBaseContextValue<any> | null>(null);

export function useSolidBaseContext<ThemeConfig>() {
	const context = useContext(SolidBaseContext);

	if (context == null) {
		if (import.meta.env.VITE_SOLIDBASE_DEV) location.reload();
		throw new Error(
			"[SolidBase]: `useSolidBaseContext` must be used within a `SolidBase` component",
		);
	}

	return context as SolidBaseContextValue<ThemeConfig>;
}
