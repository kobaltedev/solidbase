import { solidBaseConfig } from "virtual:solidbase/config";
import { createContextProvider } from "@solid-primitives/context";
import { useLocation } from "@solidjs/router";
import { createMemo } from "solid-js";

import {
	buildSolidBaseRoutePath,
	getSolidBaseRouteOptions,
	getSolidBaseRouteSelectionForPath,
	normalizeSolidBaseRouteSelection,
	type SolidBaseRouteOption,
	type SolidBaseRouteSelection,
} from "../config/route-config.js";

const [SolidBaseRoutesContextProvider, useSolidBaseRoutesContext] =
	createContextProvider(() => {
		const location = useLocation();
		const current = createMemo(
			() =>
				getSolidBaseRouteSelectionForPath(
					solidBaseConfig.routes,
					location.pathname,
				) ??
				normalizeSolidBaseRouteSelection(solidBaseConfig.routes) ??
				{},
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
				),
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
