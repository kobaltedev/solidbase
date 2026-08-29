import type { SolidBaseConfig } from "../config/index.js";
import { getSolidBaseRouteMatchForPath } from "../config/route-config.js";

export type LocalSearchSection = {
	url: string;
	title: string;
	titles: string[];
	content: string;
};

function normalizePrefix(prefix: string) {
	if (prefix === "/") return prefix;
	return prefix.replace(/\/$/, "");
}

export function getLocalSearchScopeForPath(
	path: string,
	config: Pick<SolidBaseConfig<any>, "routes" | "locales">,
) {
	const selection = getSolidBaseRouteMatchForPath(
		config.routes,
		path,
	)?.selection;
	if (!selection) {
		for (const [locale, localeConfig] of Object.entries(config.locales ?? {})) {
			if (locale === "root") continue;
			const prefix = normalizePrefix(localeConfig.link ?? `/${locale}/`);
			if (path === prefix || path.startsWith(`${prefix}/`)) return locale;
		}

		return "root";
	}

	const entries = Object.entries(selection);
	if (entries.length === 0) return "root";

	return entries
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([axis, value]) => `${axis}:${value}`)
		.join("|");
}
