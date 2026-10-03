import { access, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { join, normalize, relative, sep } from "node:path";

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

async function listFiles(dir: string): Promise<string[]> {
	let entries: import("node:fs").Dirent[];
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return [];
	}
	const files = await Promise.all(
		entries.map((entry) => {
			const path = join(dir, entry.name);
			return entry.isDirectory() ? listFiles(path) : [path];
		}),
	);
	return files.flat();
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
		// Ship the generated files with the client bundle (previously Nitro `publicAssets`).
		async generateBundle() {
			if (this.environment?.name !== "client") return;
			for (const file of await listFiles(assetRoot)) {
				this.emitFile({
					type: "asset",
					fileName: relative(assetRoot, file).split(sep).join("/"),
					source: await readFile(file),
				});
			}
		},
	};
}
