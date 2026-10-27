// Runs in a child process so the production server bundle never loads into Vite's process
// (its runtime holds handles that keep the event loop alive and hang `vite build`).
import { pathToFileURL } from "node:url";
import { extractLinks, normalizeRoute, runPrerender } from "prerender-crawler";

const STATIC_FILE_RE = /\.[a-z0-9]{1,8}$/i;
const NOT_FOUND_PROBE = "/__solidbase_404__";
const DISCOVERY_HEADER = "x-solidbase-prerender";

// v0.2 normalizes away trailing slashes. Keep the original URL spelling only
// for requests and relative-link resolution; link discovery stays with the engine.
function rememberLinkPaths(html, pageUrl, paths, toAppPath) {
	const baseMatch = /<base\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/is.exec(
		html,
	);
	let linkBase = pageUrl;
	try {
		if (baseMatch)
			linkBase = new URL(baseMatch[1] ?? baseMatch[2] ?? "", pageUrl);
	} catch {
		// Ignore invalid base URLs, as the engine does.
	}
	for (const match of html.matchAll(
		/<a\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gis,
	)) {
		try {
			const url = new URL(match[1] ?? match[2] ?? "", linkBase);
			if (url.origin !== pageUrl.origin) continue;
			const appPath = toAppPath(url.pathname);
			if (appPath === undefined) continue;
			const path = normalizeRoute(new URL(appPath, pageUrl.origin));
			if (!paths.has(path)) paths.set(path, appPath);
		} catch {
			// Invalid hrefs are not crawlable.
		}
	}
}

async function main() {
	const input = await new Promise((resolve) =>
		process.once("message", resolve),
	);
	const { serverEntry, outDir, origin, seeds, crawlLinks, notFound } = input;
	const base = (input.base ?? "/").replace(/\/$/, "");
	// Undefined for paths outside the base: those links leave the deployment.
	const toAppPath = (path) => {
		if (!base) return path || "/";
		if (path === base || path === `${base}/`) return "/";
		return path.startsWith(`${base}/`) ? path.slice(base.length) : undefined;
	};
	const mod = await import(pathToFileURL(serverEntry).href);
	const handleRequest =
		mod.handleRequest ?? mod.default?.fetch?.bind(mod.default);
	if (!handleRequest)
		throw new Error(`${serverEntry} does not export handleRequest`);

	const render = async (path) => {
		const res = await handleRequest(new Request(new URL(base + path, origin)), {
			renderMode: "async",
		});
		return { status: res.status, html: await res.text() };
	};

	const failed = [];
	// Link -> first page linking to it, so each escaping link is reported once.
	const outsideBase = new Map();
	const notFoundPages = [];
	// The first spelling wins, matching the engine's seed deduplication.
	const requestPaths = new Map();
	for (const seed of seeds) {
		const url = new URL(seed, origin);
		const path = normalizeRoute(url);
		if (!requestPaths.has(path)) requestPaths.set(path, url.pathname);
	}
	const result = await runPrerender({
		origin,
		outDir,
		pages: seeds,
		concurrency: 1,
		retries: 0,
		failOnError: false,
		// There is no base-path mapping hook in the engine. Use its extractor at
		// the public URL, then pass app-relative paths to its discovery queue.
		crawlLinks: false,
		hintHeader: DISCOVERY_HEADER,
		filter: (path) => !STATIC_FILE_RE.test(path) || path.endsWith(".html"),
		transport: {
			async fetch(request) {
				const path = new URL(request.url).pathname;
				const requestPath = requestPaths.get(path) ?? path;
				const { status, html } = await render(requestPath);
				if (status !== 200) {
					failed.push({ path, status });
					// Keep the existing policy: report every non-200, without following
					// redirects or writing their bodies as successful pages.
					return new Response(null, { status: 400 });
				}
				const pageUrl = new URL(base + requestPath, origin);
				if (crawlLinks)
					rememberLinkPaths(html, pageUrl, requestPaths, toAppPath);
				const links = [];
				for (const link of crawlLinks ? extractLinks(html, pageUrl) : []) {
					const appPath = toAppPath(link);
					if (appPath !== undefined) links.push(appPath);
					else if (!outsideBase.has(link)) outsideBase.set(link, requestPath);
				}
				return new Response(html, {
					headers: { [DISCOVERY_HEADER]: links.join(",") },
				});
			},
		},
		integrations: [
			{
				name: "solidbase",
				async teardown(context) {
					// HTTP failures are warnings; thrown handler errors must still fail
					// the worker (and therefore the Vite build).
					for (const skipped of context.skipped) {
						if (!failed.some((entry) => entry.path === skipped.path))
							throw skipped.error;
					}
					if (notFound) {
						await emitNotFoundPages(context);
					}
				},
			},
		],
	});

	// Static hosts answer a missing URL with a prerendered 404 page, but the client then
	// hydrates it against the real URL: `/fr/nope` matches `fr/[...404]` in French and
	// `/guide/nope` gets the guide sidebar, so a single root 404.html rendered for
	// `/__solidbase_404__` mismatches. Render the probe inside every directory that has
	// pages (a page's own path included, since `fr/index.mdx` alone makes `/fr` one) and
	// keep each `<dir>/404.html` whose markup differs from its nearest ancestor's, so
	// hosts that serve the closest 404.html hydrate the same tree.
	async function emitNotFoundPages(context) {
		const dirs = new Set([""]);
		for (const page of context.pages) {
			const segments = page.path.split("/").filter(Boolean);
			for (let i = 1; i <= segments.length; i++)
				dirs.add(`/${segments.slice(0, i).join("/")}`);
		}
		const emitted = new Map();
		for (const dir of [...dirs].sort()) {
			const probe = dir + NOT_FOUND_PROBE;
			const { status, html } = await render(probe);
			if (dir) {
				// A catch-all page route owns this directory; there is nothing to fall back to.
				if (status !== 404) continue;
				let parent = dir;
				do parent = parent.slice(0, parent.lastIndexOf("/"));
				while (!emitted.has(parent));
				if (html.replaceAll(probe, "") === emitted.get(parent)) continue;
			}
			emitted.set(dir, html.replaceAll(probe, ""));
			const filename = `${dir.slice(1)}${dir ? "/" : ""}404.html`;
			context.emitFile({ filename, contents: html });
			notFoundPages.push(filename);
		}
	}

	const written = result.pages.map((page) => page.path);
	// The server runtime keeps the loop alive, so exit explicitly, but only once the
	// result has been handed to the IPC channel.
	process.send(
		{
			written,
			failed,
			outsideBase: [...outsideBase].map(([link, path]) => ({ path, link })),
			notFoundPages,
		},
		() => process.exit(0),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
