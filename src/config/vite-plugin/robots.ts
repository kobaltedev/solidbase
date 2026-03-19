import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { PluginOption } from "vite";

import type { SolidBaseResolvedConfig } from "../index.js";
import { buildRobotsTxt } from "../robots.js";

const ROBOTS_PUBLIC_ASSETS_DIR = join("node_modules", ".solidbase", "robots");

async function emptyDir(dir: string) {
	await rm(dir, { recursive: true, force: true });
	await mkdir(dir, { recursive: true });
}

async function writeRobotsAsset(
	root: string,
	config: SolidBaseResolvedConfig<any>,
) {
	const robots = buildRobotsTxt(config);
	if (!robots) return;

	const outputDir = join(root, ROBOTS_PUBLIC_ASSETS_DIR);

	await emptyDir(outputDir);
	await writeFile(join(outputDir, "robots.txt"), robots, "utf8");
}

export default function solidBaseRobotsPlugin(
	config: SolidBaseResolvedConfig<any>,
): PluginOption {
	if (!config.robots) return [];

	let root = process.cwd();

	return {
		name: "solidbase:robots",
		config(viteConfig) {
			const nitroConfig = (viteConfig as any).nitro ?? {};

			return {
				nitro: {
					...nitroConfig,
					publicAssets: [
						...(nitroConfig.publicAssets ?? []),
						{
							dir: ROBOTS_PUBLIC_ASSETS_DIR,
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
			await writeRobotsAsset(root, config);
		},
	};
}
