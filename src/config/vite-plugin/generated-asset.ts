import { mkdir, rm } from "node:fs/promises";
import { sep } from "node:path";

import type { PluginOption } from "vite";

type GeneratedAssetPluginOptions = {
	name: string;
	assetDir: string;
	write(root: string): Promise<void>;
	watchRoutes?: boolean;
};

export async function emptyDir(dir: string) {
	await rm(dir, { recursive: true, force: true });
	await mkdir(dir, { recursive: true });
}

export function isRoutesFile(file: string) {
	return file.includes(`${sep}src${sep}routes${sep}`);
}

export function createGeneratedAssetPlugin(
	options: GeneratedAssetPluginOptions,
): PluginOption {
	let root = process.cwd();

	return {
		name: options.name,
		config(viteConfig) {
			const nitroConfig = (viteConfig as any).nitro ?? {};

			return {
				nitro: {
					...nitroConfig,
					publicAssets: [
						...(nitroConfig.publicAssets ?? []),
						{
							dir: options.assetDir,
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
			await options.write(root);
		},
		async handleHotUpdate(ctx) {
			if (!options.watchRoutes || !isRoutesFile(ctx.file)) return;

			await options.write(root);
		},
	};
}
