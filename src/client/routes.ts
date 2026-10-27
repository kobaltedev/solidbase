import { solidBaseConfig } from "virtual:solidbase/config";
import { createOptionalContextProvider } from "@solid-primitives/context";
import { createMemo } from "solid-js";

import {
	buildSolidBaseRoutePath,
	getSolidBaseRouteFallbackOptions,
	getSolidBaseRouteOptions,
	getSolidBaseRouteSelectionForPath,
	normalizeSolidBaseRouteSelection,
	resolveSolidBaseRouteValueOverrides,
	type SolidBaseRouteOption,
	type SolidBaseRouteSelection,
} from "../config/route-config.js";
import { useAppPathname } from "./base-path.js";
import { useRouteSolidBaseConfig } from "./config.js";

const [SolidBaseRoutesContextProvider, useSolidBaseRoutesContext] =
	createOptionalContextProvider(() => {
		const pathname = useAppPathname();
		const current = createMemo(
			() =>
				getSolidBaseRouteSelectionForPath(solidBaseConfig.routes, pathname()) ??
				normalizeSolidBaseRouteSelection(solidBaseConfig.routes) ??
				{},
		);
		const routeOverride = createMemo(() =>
			resolveSolidBaseRouteValueOverrides(
				solidBaseConfig.routes,
				solidBaseConfig.overrides ?? [],
				current(),
			),
		);

		return {
			routes: solidBaseConfig.routes,
			current,
			path: (selection: Partial<SolidBaseRouteSelection>) =>
				buildSolidBaseRoutePath(solidBaseConfig.routes, {
					...current(),
					...selection,
				}),
			options: (axis: string, selection?: Partial<SolidBaseRouteSelection>) =>
				getSolidBaseRouteOptions(
					solidBaseConfig.routes,
					axis,
					selection ?? current(),
					routeOverride(),
				),
			routeOverride,
		};
	});

export { SolidBaseRoutesContextProvider };

export function useSolidBaseRoutes() {
	return (
		useSolidBaseRoutesContext() ??
		(() => {
			throw new Error(
				"useSolidBaseRoutes must be called underneath a SolidBaseRoutesContextProvider",
			);
		})()
	);
}

export function useSolidBaseRoute() {
	return useSolidBaseRoutes().current;
}

export function useSolidBaseRouteOptions(axis: string) {
	const routes = useSolidBaseRoutes();

	return createMemo<SolidBaseRouteOption[]>(() => routes.options(axis));
}

export function useSolidBaseRouteFallbackOptions(axis: string) {
	const config = useRouteSolidBaseConfig();
	const current = useSolidBaseRoute();

	return createMemo(() =>
		getSolidBaseRouteFallbackOptions(
			config().routes,
			axis,
			current(),
			config().routeOverride,
		),
	);
}
