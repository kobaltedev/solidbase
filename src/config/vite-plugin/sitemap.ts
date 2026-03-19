import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";

import type { PluginOption } from "vite";

import type { SolidBaseResolvedConfig } from "../index.js";
import { getSitemapEntries } from "../sitemap-index.js";
import { buildSitemapXmlFiles } from "../sitemap-xml.js";

const SITEMAP_PUBLIC_ASSETS_DIR = join("node_modules", ".solidbase", "sitemap");

async function emptyDir(dir: string) {
	await rm(dir, { recursive: true, force: true });
	await mkdir(dir, { recursive: true });
}

async function writeSitemapAssets(
	root: string,
	config: SolidBaseResolvedConfig<any>,
) {
	if (!config.sitemap || typeof config.sitemap !== "object") return;

	const entries = await getSitemapEntries(root, config);
	const files = buildSitemapXmlFiles(config.sitemap.hostname, entries, {
		maxUrlsPerSitemap: config.sitemap.maxUrlsPerSitemap,
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
	if (!config.sitemap || typeof config.sitemap !== "object") return [];

	let root = process.cwd();

	return {
		name: "solidbase:sitemap",
		config(viteConfig) {
			const nitroConfig = (viteConfig as any).nitro ?? {};

			return {
				nitro: {
					...nitroConfig,
					publicAssets: [
						...(nitroConfig.publicAssets ?? []),
						{
							dir: SITEMAP_PUBLIC_ASSETS_DIR,
							baseURL: "/",
							fallthrough: true,
							ignore: false,
						},
					],
				},
			} as any;
		},
		configResolved(resolvedConfig) {
			root = resolvedConfig.root;
		},
		async buildStart() {
			await writeSitemapAssets(root, config);
		},
		async handleHotUpdate(ctx) {
			if (!ctx.file.includes(`${sep}src${sep}routes${sep}`)) {
				return;
			}

			await writeSitemapAssets(root, config);
		},
	};
}
