import type { RobotsRule, SolidBaseResolvedConfig } from "./index.js";
import { getSitemapHostname } from "./index.js";

const DEFAULT_ROBOTS_RULES = [
	{ userAgent: "*", allow: ["/"] },
] satisfies RobotsRule[];

function toArray(value: string | string[]) {
	return Array.isArray(value) ? value : [value];
}

function normalizeRulePaths(paths: string[] | undefined) {
	return paths?.length ? paths : undefined;
}

function getDefaultSitemapUrl(config: SolidBaseResolvedConfig<any>) {
	const hostname = getSitemapHostname(config);
	if (!hostname) return undefined;
	return new URL("sitemap.xml", hostname).toString();
}

function getRobotsRules(config: SolidBaseResolvedConfig<any>) {
	if (!config.robots || typeof config.robots !== "object") {
		return DEFAULT_ROBOTS_RULES;
	}

	return config.robots.rules?.length
		? config.robots.rules
		: DEFAULT_ROBOTS_RULES;
}

function getRobotsSitemapUrl(config: SolidBaseResolvedConfig<any>) {
	if (!config.robots) return undefined;
	if (config.robots === true) return getDefaultSitemapUrl(config);
	if (config.robots.sitemap === false) return undefined;
	if (typeof config.robots.sitemap === "string") return config.robots.sitemap;
	return getDefaultSitemapUrl(config);
}

function serializeRule(rule: RobotsRule) {
	const lines = [
		...toArray(rule.userAgent).map((userAgent) => `User-agent: ${userAgent}`),
	];

	for (const allow of normalizeRulePaths(rule.allow) ?? []) {
		lines.push(`Allow: ${allow}`);
	}

	for (const disallow of normalizeRulePaths(rule.disallow) ?? []) {
		lines.push(`Disallow: ${disallow}`);
	}

	return lines.join("\n");
}

export function buildRobotsTxt(config: SolidBaseResolvedConfig<any>) {
	if (!config.robots) return "";

	const ruleBlocks = getRobotsRules(config).map(serializeRule);
	const sitemapUrl = getRobotsSitemapUrl(config);
	const lines = sitemapUrl
		? [...ruleBlocks, `Sitemap: ${sitemapUrl}`]
		: ruleBlocks;

	return `${lines.join("\n\n")}\n`;
}
