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

export type SolidBaseRoutePathMatch = {
	selection: SolidBaseRouteSelection;
	restPath: `/${string}`;
};

type RouteConfigValue = Record<string, unknown>;

type RouteTemplateSegment =
	| { type: "static"; value: string }
	| { type: "axis"; name: string };

const ROUTES_RESERVED_KEYS = new Set(["path", "include"]);

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

function getSolidBaseRouteAxisMap(routes: SolidBaseRoutesConfig | undefined) {
	return new Map(getSolidBaseRouteAxes(routes));
}

function assertSolidBaseRouteConfig(
	condition: unknown,
	message: string,
): asserts condition {
	if (!condition) throw new Error(`[SolidBase]: ${message}`);
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

function getRouteTemplateAxisNames(path: string) {
	return getRouteTemplateSegments(path)
		.filter((segment): segment is { type: "axis"; name: string } => {
			return segment.type === "axis";
		})
		.map((segment) => segment.name);
}

function toRuleValues(value: string | string[]) {
	return Array.isArray(value) ? value : [value];
}

function validateRouteRule(
	rule: SolidBaseRouteRule,
	axisMap: Map<string, SolidBaseRouteAxisConfig>,
	source: string,
) {
	for (const [axisName, value] of Object.entries(rule)) {
		const axis = axisMap.get(axisName);
		assertSolidBaseRouteConfig(
			axis,
			"`" + source + "` references unknown route axis `" + axisName + "`.",
		);

		for (const valueName of toRuleValues(value)) {
			assertSolidBaseRouteConfig(
				Object.hasOwn(axis.values, valueName),
				"`" +
					source +
					"` references unknown `" +
					axisName +
					"` value `" +
					valueName +
					"`.",
			);
		}
	}
}

function getInternalRouteValueEntries(axis: SolidBaseRouteAxisConfig) {
	return Object.entries(axis.values).filter(([, value]) => !value.href);
}

function matchRoutePathSegment(
	axis: SolidBaseRouteAxisConfig,
	pathSegment: string | undefined,
) {
	const entries = getInternalRouteValueEntries(axis);
	const defaultEntry = entries.find(([valueName]) => valueName === axis.default);
	const explicitMatch =
		pathSegment === undefined
			? undefined
			: entries.find(([, value]) => {
					const valuePath = trimSlashes(value.path ?? "");
					return valuePath !== "" && pathSegment === valuePath;
				});

	if (explicitMatch) return explicitMatch;
	if (!defaultEntry) return undefined;

	const defaultPath = trimSlashes(defaultEntry[1].path ?? defaultEntry[0]);
	return defaultPath === "" ? defaultEntry : undefined;
}

function getRouteValuePath(valueName: string, value: SolidBaseRouteValueConfig) {
	return trimSlashes(value.path ?? valueName);
}

export function validateSolidBaseRoutesConfig(
	routes: SolidBaseRoutesConfig | undefined,
	overrides: RouteConfigValue[] = [],
	overrideConfigKeys: Iterable<string> = [],
) {
	if (!routes) return;

	const axisMap = getSolidBaseRouteAxisMap(routes);
	const configKeys = new Set(overrideConfigKeys);
	const placeholders = getRouteTemplateAxisNames(routes.path);

	assertSolidBaseRouteConfig(
		placeholders.length > 0,
		"`routes.path` must include at least one route axis placeholder.",
	);

	for (const key of Object.keys(routes)) {
		if (ROUTES_RESERVED_KEYS.has(key)) continue;
		assertSolidBaseRouteConfig(
			axisMap.has(key),
			"`routes." + key + "` must include `default` and `values`.",
		);
	}

	for (const axisName of placeholders) {
		assertSolidBaseRouteConfig(
			axisMap.has(axisName),
			"`routes.path` references unknown route axis `" + axisName + "`.",
		);
	}

	for (const [axisName, axis] of axisMap) {
		assertSolidBaseRouteConfig(
			placeholders.includes(axisName),
			"`routes." +
				axisName +
				"` must be included in `routes.path` as `{" +
				axisName +
				"}`.",
		);
		assertSolidBaseRouteConfig(
			Object.hasOwn(axis.values, axis.default),
			"`routes." +
				axisName +
				".default` must reference a key in `routes." +
				axisName +
				".values`.",
		);
	}

	for (const rule of routes.include ?? []) {
		validateRouteRule(rule, axisMap, "routes.include");
	}

	for (const override of overrides) {
		const selectors: SolidBaseRouteRule = {};

		for (const [key, value] of Object.entries(override)) {
			if (axisMap.has(key)) {
				assertSolidBaseRouteConfig(
					typeof value === "string" || Array.isArray(value),
					"`overrides` selector `" + key + "` must be a string or string array.",
				);
				selectors[key] = value;
				continue;
			}

			assertSolidBaseRouteConfig(
				configKeys.has(key),
				"`overrides` contains unknown config key or route axis `" + key + "`.",
			);
		}

		validateRouteRule(selectors, axisMap, "overrides");
	}
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

	const axes = getSolidBaseRouteAxisMap(routes);
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

export function getSolidBaseRouteSelectionForPath(
	routes: SolidBaseRoutesConfig | undefined,
	path: string,
) {
	return getSolidBaseRouteMatchForPath(routes, path)?.selection;
}

export function getSolidBaseRouteMatchForPath(
	routes: SolidBaseRoutesConfig | undefined,
	path: string,
) {
	if (!routes) return undefined;

	const axes = getSolidBaseRouteAxisMap(routes);
	const pathSegments = trimSlashes(path).split("/").filter(Boolean);
	const selection: SolidBaseRouteSelection = {};
	let pathIndex = 0;

	for (const segment of getRouteTemplateSegments(routes.path)) {
		if (segment.type === "static") {
			if (pathSegments[pathIndex] !== segment.value) return undefined;
			pathIndex++;
			continue;
		}

		const axis = axes.get(segment.name);
		if (!axis) return undefined;

		const matched = matchRoutePathSegment(axis, pathSegments[pathIndex]);

		if (!matched) return undefined;

		const [valueName, value] = matched;
		selection[segment.name] = valueName;

		if (getRouteValuePath(valueName, value) !== "") pathIndex++;
	}

	if (!isSolidBaseRouteIncluded(routes, selection)) return undefined;

	return {
		selection,
		restPath: normalizeRoutePath(pathSegments.slice(pathIndex).join("/")),
	} satisfies SolidBaseRoutePathMatch;
}

export function getSolidBaseRoutePathWithRest(
	routes: SolidBaseRoutesConfig | undefined,
	selection: Partial<SolidBaseRouteSelection>,
	restPath: string,
) {
	const routePath = buildSolidBaseRoutePath(routes, selection);
	if (!routePath) return undefined;

	return normalizeRoutePath(`${routePath}/${restPath}`);
}

export function getSolidBaseRouteOptions(
	routes: SolidBaseRoutesConfig | undefined,
	axisName: string,
	current: Partial<SolidBaseRouteSelection> = {},
): SolidBaseRouteOption[] {
	if (!routes) return [];

	const axis = getSolidBaseRouteAxisMap(routes).get(axisName);
	if (!axis) return [];

	const normalized = normalizeSolidBaseRouteSelection(routes, current) ?? {};
	const options: SolidBaseRouteOption[] = [];

	for (const [valueName, value] of Object.entries(axis.values)) {
		if (value.href) {
			options.push({
				name: valueName,
				axis: axisName,
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
			axis: axisName,
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
