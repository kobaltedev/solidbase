import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin, ViteBuilder } from "vite";

import type { SolidBaseResolvedConfig } from "../index.js";
import { getRoutesIndex } from "../routes-index.js";

export interface PrerenderOptions {
	/** Extra paths to render on top of the markdown route index (and `/`). */
	routes?: string[];
	/** Follow same-origin links found in rendered pages. @default true */
	crawlLinks?: boolean;
	/** Also render a never-matching path and write it as `404.html`. @default true */
	notFound?: boolean;
	/** Origin used for the synthetic requests. Defaults to `siteUrl`, else `http://localhost`. */
	origin?: string;
}

interface WorkerInput {
	serverEntry: string;
	outDir: string;
	origin: string;
	/** Vite `base`; pages are requested at `base + path` and written relative to `outDir`. */
	base: string;
	seeds: string[];
	crawlLinks: boolean;
	notFound: boolean;
}

interface WorkerResult {
	written: string[];
	failed: Array<{ path: string; status: number }>;
}

const WORKER = fileURLToPath(
	new URL("./prerender-worker.mjs", import.meta.url),
);

function runWorker(input: WorkerInput): Promise<WorkerResult> {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(process.execPath, [WORKER], {
			stdio: ["pipe", "pipe", "inherit"],
			env: process.env,
		});
		let stdout = "";
		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.on("error", reject);
		child.on("close", (code) => {
			if (code !== 0) {
				reject(
					new Error(`[solidbase] prerender worker exited with code ${code}`),
				);
				return;
			}
			try {
				resolvePromise(JSON.parse(stdout) as WorkerResult);
			} catch (error) {
				reject(error);
			}
		});
		child.stdin.end(JSON.stringify(input));
	});
}

/**
 * Static site generation for `@solidjs/vite-plugin` start mode. After the client and server
 * bundles are built, every markdown route (plus `/`, configured extras, and crawled links) is
 * rendered through the production `handleRequest` handler and written into the client output
 * directory, so `dist/client` deploys as a static site. Replaces Nitro's `prerender.crawlLinks`.
 */
export function solidBasePrerenderPlugin(
	sbConfig: SolidBaseResolvedConfig<any>,
	options: PrerenderOptions = {},
): Plugin {
	let root = process.cwd();
	let base = "/";

	return {
		name: "solidbase:prerender",
		apply: "build",
		configResolved(config) {
			root = config.root;
			base = config.base;
		},
		buildApp: {
			order: "post",
			async handler(builder: ViteBuilder) {
				const client = builder.environments.client;
				const ssr = builder.environments.ssr;
				if (!client || !ssr) return; // not an SSR start-mode build

				// Declaring a buildApp hook makes this plugin the build orchestrator as far as
				// @solidjs/vite-plugin is concerned, so finish the app build here: client first
				// (the server build reads its manifest), then everything else still unbuilt.
				for (const env of [
					client,
					...Object.values(builder.environments).filter((e) => e !== client),
				]) {
					if (!env.isBuilt) await builder.build(env);
				}

				const clientOut = resolve(root, client.config.build.outDir);
				const serverOut = resolve(root, ssr.config.build.outDir);
				const serverEntry = join(serverOut, "server.js");

				const origin = new URL(
					options.origin ?? sbConfig.siteUrl ?? "http://localhost",
				).origin;
				const index = await getRoutesIndex(root);
				const seeds = [
					...new Set([
						"/",
						...index.map((e) => e.routePath),
						...(options.routes ?? []),
					]),
				];

				// Rendering happens in a child process: the production server runtime keeps the
				// event loop alive once imported, which would hang `vite build` after the hook.
				const { written, failed } = await runWorker({
					serverEntry,
					outDir: clientOut,
					origin,
					base,
					seeds,
					crawlLinks: options.crawlLinks ?? true,
					notFound: options.notFound ?? true,
				});

				const log = client.logger;
				log.info(
					`[solidbase] prerendered ${written.length} page${written.length === 1 ? "" : "s"} into ${client.config.build.outDir}${(options.notFound ?? true) ? " (+ 404.html)" : ""}`,
				);
				for (const { path, status } of failed) {
					log.warn(`[solidbase] prerender skipped ${path} (HTTP ${status})`);
				}
			},
		},
	};
}
