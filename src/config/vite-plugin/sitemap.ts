import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { PluginOption } from "vite";

import { getSitemapHostname, type SolidBaseResolvedConfig } from "../index.js";
import { getSitemapEntries } from "../sitemap-index.js";
import { buildSitemapXmlFiles } from "../sitemap-xml.js";
import { createGeneratedAssetPlugin, emptyDir } from "./generated-asset.js";

const SITEMAP_PUBLIC_ASSETS_DIR = join("node_modules", ".solidbase", "sitemap");

async function writeSitemapAssets(
	root: string,
	config: SolidBaseResolvedConfig<any>,
) {
	const hostname = getSitemapHostname(config);
	if (!hostname) return;

	const entries = await getSitemapEntries(root, config);
	const files = buildSitemapXmlFiles(hostname, entries, {
		maxUrlsPerSitemap:
			typeof config.sitemap === "object"
				? config.sitemap.maxUrlsPerSitemap
				: undefined,
	});
	const outputDir = join(root, SITEMAP_PUBLIC_ASSETS_DIR);

	await emptyDir(outputDir);
	await Promise.all(
		files.map(({ fileName, content }) =>
			writeFile(join(outputDir, fileName), content, "utf8"),
		),
	);
}

export default function solidBaseSitemapPlugin(
	config: SolidBaseResolvedConfig<any>,
): PluginOption {
	if (!config.sitemap) return [];

	return createGeneratedAssetPlugin({
		name: "solidbase:sitemap",
		apply: "build",
		assetDir: SITEMAP_PUBLIC_ASSETS_DIR,
		watchRoutes: true,
		write(root) {
			return writeSitemapAssets(root, config);
		},
	});
}
