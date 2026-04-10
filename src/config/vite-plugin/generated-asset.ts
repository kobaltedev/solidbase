import { access, mkdir, readFile, rm, stat } from "node:fs/promises";
import { join, normalize, relative } from "node:path";

import type { PluginOption } from "vite";

type GeneratedAssetPluginOptions = {
	name: string;
	apply?: "serve" | "build";
	assetDir: string;
	write(
		root: string,
		resolver: (
			source: string,
			importer: string,
		) => Promise<{ id: string } | null>,
	): Promise<void>;
};

export async function emptyDir(dir: string) {
	await rm(dir, { recursive: true, force: true });
	await mkdir(dir, { recursive: true });
}

export function createGeneratedAssetPlugin(
	options: GeneratedAssetPluginOptions,
): PluginOption {
	let root = process.cwd();
	let assetRoot = join(root, options.assetDir);

	async function serveGeneratedAsset(url: string | undefined, res: any) {
		if (!url || url === "/") return false;

		const pathname = url.split("?")[0] ?? "/";
		const relativePath = pathname.replace(/^\//, "");
		if (!relativePath) return false;

		const filePath = normalize(join(assetRoot, relativePath));
		const assetRelativePath = relative(assetRoot, filePath);
		if (assetRelativePath === ".." || assetRelativePath.startsWith(`..`)) {
			return false;
		}

		try {
			await access(filePath);
		} catch {
			return false;
		}

		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) return false;

		const content = await readFile(filePath);
		if (filePath.endsWith(".md")) {
			res.setHeader("Content-Type", "text/markdown; charset=utf-8");
			res.setHeader("Content-Disposition", "inline");
		} else if (filePath.endsWith(".txt")) {
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
		}
		res.statusCode = 200;
		res.end(content);
		return true;
	}

	return {
		name: options.name,
		apply: options.apply,
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
			assetRoot = join(root, options.assetDir);
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				void serveGeneratedAsset(req.url, res).then((served) => {
					if (!served) next();
				});
			});
		},
		async buildStart() {
			await options.write(root, (source: string, importer: string) =>
				this.resolve(source, importer),
			);
		},
	};
}
