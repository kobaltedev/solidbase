export type SolidBaseRouteSelection = Record<string, string>;

export type SolidBaseRouteRule = Record<string, string | string[]>;

export type SolidBaseRouteValueConfig = {
	path?: string;
	href?: string;
	label?: string;
	title?: string;
	status?: string;
	lang?: string;
} & Record<string, unknown>;

export type SolidBaseRouteAxisConfig = {
	default: string;
	values: Record<string, SolidBaseRouteValueConfig>;
};

export type SolidBaseRoutesConfig = {
	path: `/${string}`;
	include?: SolidBaseRouteRule[];
	[key: string]:
		| `/${string}`
		| SolidBaseRouteRule[]
		| SolidBaseRouteAxisConfig
		| undefined;
};

export type SolidBaseRouteOption = {
	name: string;
	axis: string;
	path?: string;
	href?: string;
	isExternal: boolean;
	selection?: SolidBaseRouteSelection;
	meta: SolidBaseRouteValueConfig;
};

type RouteConfigValue = Record<string, unknown>;

type RouteTemplateSegment =
	| { type: "static"; value: string }
	| { type: "axis"; name: string };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSolidBaseRouteAxisConfig(
	value: unknown,
): value is SolidBaseRouteAxisConfig {
	return (
		isRecord(value) &&
		typeof value.default === "string" &&
		isRecord(value.values)
	);
}

export function getSolidBaseRouteAxes(
	routes: SolidBaseRoutesConfig | undefined,
) {
	if (!routes) return [];

	return Object.entries(routes).filter(
		(entry): entry is [string, SolidBaseRouteAxisConfig] =>
			isSolidBaseRouteAxisConfig(entry[1]),
	);
}

export function getSolidBaseRouteAxisNames(
	routes: SolidBaseRoutesConfig | undefined,
) {
	return getSolidBaseRouteAxes(routes).map(([name]) => name);
}

function trimSlashes(value: string) {
	return value.replace(/^\/+|\/+$/g, "");
}

function normalizeRoutePath(path: string): `/${string}` {
	const normalized = `/${path
		.split("/")
		.map((segment) => trimSlashes(segment))
		.filter(Boolean)
		.join("/")}`;

	return normalized as `/${string}`;
}

function getRouteTemplateSegments(path: string): RouteTemplateSegment[] {
	return path
		.split("/")
		.map((segment) => trimSlashes(segment))
		.filter(Boolean)
		.map((segment) => {
			const match = segment.match(/^\{([^}]+)\}$/);
			if (match) return { type: "axis", name: match[1]! };
			return { type: "static", value: segment };
		});
}

export function normalizeSolidBaseRouteSelection(
	routes: SolidBaseRoutesConfig | undefined,
	selection: Partial<SolidBaseRouteSelection> = {},
) {
	const normalized: SolidBaseRouteSelection = {};

	for (const [axisName, axisConfig] of getSolidBaseRouteAxes(routes)) {
		const valueName = selection[axisName] ?? axisConfig.default;
		const value = axisConfig.values[valueName];

		if (!value || value.href) return undefined;

		normalized[axisName] = valueName;
	}

	return normalized;
}

export function matchesSolidBaseRouteRule(
	selection: SolidBaseRouteSelection,
	rule: SolidBaseRouteRule,
) {
	for (const [axisName, allowed] of Object.entries(rule)) {
		const current = selection[axisName];

		if (Array.isArray(allowed)) {
			if (!current || !allowed.includes(current)) return false;
			continue;
		}

		if (current !== allowed) return false;
	}

	return true;
}

export function isSolidBaseRouteIncluded(
	routes: SolidBaseRoutesConfig | undefined,
	selection: Partial<SolidBaseRouteSelection>,
) {
	const normalized = normalizeSolidBaseRouteSelection(routes, selection);
	if (!normalized) return false;
	if (!routes?.include) return true;

	return routes.include.some((rule) =>
		matchesSolidBaseRouteRule(normalized, rule),
	);
}

export function buildSolidBaseRoutePath(
	routes: SolidBaseRoutesConfig | undefined,
	selection: Partial<SolidBaseRouteSelection> = {},
) {
	const normalized = normalizeSolidBaseRouteSelection(routes, selection);
	if (!routes || !normalized || !isSolidBaseRouteIncluded(routes, normalized)) {
		return undefined;
	}

	const axes = new Map(getSolidBaseRouteAxes(routes));
	const pathSegments = getRouteTemplateSegments(routes.path).map((segment) => {
		if (segment.type === "static") return segment.value;

		const axis = axes.get(segment.name);
		const valueName = normalized[segment.name];
		if (!axis || !valueName) return "";

		const value = axis.values[valueName];
		return trimSlashes(value?.path ?? valueName);
	});

	return normalizeRoutePath(pathSegments.join("/"));
}

export function getSolidBaseRouteSelections(
	routes: SolidBaseRoutesConfig | undefined,
) {
	const axes = getSolidBaseRouteAxes(routes);
	if (axes.length === 0) return [];

	const selections = axes.reduce<SolidBaseRouteSelection[]>(
		(acc, [axisName, axisConfig]) => {
			const next: SolidBaseRouteSelection[] = [];

			for (const selection of acc) {
				for (const [valueName, value] of Object.entries(axisConfig.values)) {
					if (value.href) continue;
					next.push({ ...selection, [axisName]: valueName });
				}
			}

			return next;
		},
		[{}],
	);

	return selections.filter((selection) =>
		isSolidBaseRouteIncluded(routes, selection),
	);
}

export function getSolidBaseRouteSelectionForPath(
	routes: SolidBaseRoutesConfig | undefined,
	path: string,
) {
	const normalizedPath = normalizeRoutePath(path);
	const selections = getSolidBaseRouteSelections(routes).sort((a, b) => {
		const aPath = buildSolidBaseRoutePath(routes, a) ?? "/";
		const bPath = buildSolidBaseRoutePath(routes, b) ?? "/";
		return bPath.length - aPath.length;
	});

	return selections.find(
		(selection) => buildSolidBaseRoutePath(routes, selection) === normalizedPath,
	);
}

export function getSolidBaseRouteOptions(
	routes: SolidBaseRoutesConfig | undefined,
	axisName: string,
	current: Partial<SolidBaseRouteSelection> = {},
): SolidBaseRouteOption[] {
	if (!routes) return [];

	const axis = getSolidBaseRouteAxes(routes).find(
		([name]) => name === axisName,
	);
	if (!axis) return [];

	const [name, config] = axis;
	const normalized = normalizeSolidBaseRouteSelection(routes, current) ?? {};
	const options: SolidBaseRouteOption[] = [];

	for (const [valueName, value] of Object.entries(config.values)) {
		if (value.href) {
			options.push({
				name: valueName,
				axis: name,
				href: value.href,
				isExternal: true,
				meta: value,
			});
			continue;
		}

		const selection = {
			...normalized,
			[axisName]: valueName,
		};

		if (!isSolidBaseRouteIncluded(routes, selection)) continue;

		options.push({
			name: valueName,
			axis: name,
			path: buildSolidBaseRoutePath(routes, selection),
			isExternal: false,
			selection,
			meta: value,
		});
	}

	return options;
}

function splitRouteOverride(override: RouteConfigValue, axisNames: string[]) {
	const selectors: SolidBaseRouteRule = {};
	const config: RouteConfigValue = {};

	for (const [key, value] of Object.entries(override)) {
		if (axisNames.includes(key)) {
			if (typeof value === "string" || Array.isArray(value)) {
				selectors[key] = value as string | string[];
			}
			continue;
		}

		if (key !== "routes" && key !== "overrides") config[key] = value;
	}

	return { selectors, config };
}

function mergeRouteConfig<T extends RouteConfigValue>(
	base: T,
	override: RouteConfigValue,
): T {
	const result: RouteConfigValue = { ...base };

	for (const [key, value] of Object.entries(override)) {
		if (key === "themeConfig" && isRecord(result[key]) && isRecord(value)) {
			result[key] = {
				...result[key],
				...value,
			};
			continue;
		}

		result[key] = value;
	}

	return result as T;
}

export function resolveSolidBaseRouteConfig<T extends RouteConfigValue>(
	baseConfig: T & {
		overrides?: RouteConfigValue[];
		routes?: SolidBaseRoutesConfig;
	},
	selection: Partial<SolidBaseRouteSelection>,
): T {
	const { overrides: _overrides, ...base } = baseConfig;
	const routes = baseConfig.routes;
	if (!routes) return base as T;

	const normalized = normalizeSolidBaseRouteSelection(routes, selection);

	if (!normalized || !isSolidBaseRouteIncluded(routes, normalized)) {
		return base as T;
	}

	const axisNames = getSolidBaseRouteAxisNames(routes);
	let config = base as T;

	for (const override of baseConfig.overrides ?? []) {
		const { selectors, config: overrideConfig } = splitRouteOverride(
			override,
			axisNames,
		);

		if (!matchesSolidBaseRouteRule(normalized, selectors)) continue;

		config = mergeRouteConfig(config, overrideConfig);
	}

	return config;
}
