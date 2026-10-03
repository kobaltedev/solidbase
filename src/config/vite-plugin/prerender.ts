import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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

type HandleRequest = (
	request: Request,
	options?: { renderMode?: "stream" | "async" },
) => Promise<Response>;

const NOT_FOUND_PROBE = "/__solidbase_404__";
const HREF_RE = /\shref=(?:"([^"]*)"|'([^']*)')/g;
const STATIC_FILE_RE = /\.[a-z0-9]{1,8}$/i;

/** Render the final HTML for a path (all `<Loading>` boundaries settled, head tags inlined). */
export async function renderPath(
	handleRequest: HandleRequest,
	origin: string,
	path: string,
) {
	const response = await handleRequest(new Request(new URL(path, origin)), {
		renderMode: "async",
	});
	return { status: response.status, html: await response.text() };
}

export function toOutputFile(outDir: string, path: string) {
	const clean = path.split("?")[0]!.split("#")[0]!;
	if (STATIC_FILE_RE.test(clean) && !clean.endsWith("/")) {
		return join(outDir, clean);
	}
	return join(outDir, clean, "index.html");
}

export function extractLinks(html: string, origin: string) {
	const links = new Set<string>();
	for (const match of html.matchAll(HREF_RE)) {
		const raw = match[1] ?? match[2] ?? "";
		if (!raw || raw.startsWith("#") || raw.startsWith("mailto:")) continue;
		let url: URL;
		try {
			url = new URL(raw, origin);
		} catch {
			continue;
		}
		if (url.origin !== origin) continue;
		const path = url.pathname;
		if (STATIC_FILE_RE.test(path) && !path.endsWith(".html")) continue;
		links.add(path);
	}
	return links;
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

	return {
		name: "solidbase:prerender",
		apply: "build",
		configResolved(config) {
			root = config.root;
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

				const mod = await import(pathToFileURL(serverEntry).href);
				const handleRequest: HandleRequest | undefined =
					mod.handleRequest ?? mod.default?.fetch?.bind(mod.default);
				if (!handleRequest) {
					throw new Error(
						`[solidbase] prerender: ${serverEntry} does not export handleRequest`,
					);
				}

				const origin = new URL(
					options.origin ?? sbConfig.siteUrl ?? "http://localhost",
				).origin;
				const crawl = options.crawlLinks ?? true;

				const index = await getRoutesIndex(root);
				const queue = [
					"/",
					...index.map((e) => e.routePath),
					...(options.routes ?? []),
				];
				const seen = new Set<string>();
				const written: string[] = [];
				const failed: Array<{ path: string; status: number }> = [];

				while (queue.length) {
					const path = queue.shift()!;
					if (seen.has(path)) continue;
					seen.add(path);

					const { status, html } = await renderPath(
						handleRequest,
						origin,
						path,
					);
					if (status !== 200) {
						failed.push({ path, status });
						continue;
					}
					const file = toOutputFile(clientOut, path);
					await mkdir(dirname(file), { recursive: true });
					await writeFile(file, html);
					written.push(path);

					if (crawl)
						for (const link of extractLinks(html, origin)) queue.push(link);
				}

				if (options.notFound ?? true) {
					const { html } = await renderPath(
						handleRequest,
						origin,
						NOT_FOUND_PROBE,
					);
					await writeFile(join(clientOut, "404.html"), html);
				}

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
