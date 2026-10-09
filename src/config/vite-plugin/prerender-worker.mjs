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
			const path = normalizeRoute(
				new URL(toAppPath(url.pathname), pageUrl.origin),
			);
			if (!paths.has(path)) paths.set(path, toAppPath(url.pathname));
		} catch {
			// Invalid hrefs are not crawlable.
		}
	}
}

async function main() {
	const input = JSON.parse(await readStdin());
	const { serverEntry, outDir, origin, seeds, crawlLinks, notFound } = input;
	const base = (input.base ?? "/").replace(/\/$/, "");
	const toAppPath = (path) => {
		if (!base) return path || "/";
		if (path === base || path === `${base}/`) return "/";
		return path.startsWith(`${base}/`) ? path.slice(base.length) : path;
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
				const links = crawlLinks
					? extractLinks(html, pageUrl).map(toAppPath)
					: [];
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
						const { html } = await render(NOT_FOUND_PROBE);
						context.emitFile({ filename: "404.html", contents: html });
					}
				},
			},
		],
	});
	const written = result.pages.map((page) => page.path);
	process.stdout.write(JSON.stringify({ written, failed }));
	// The server runtime keeps the loop alive; we are done.
	process.exit(0);
}

function readStdin() {
	return new Promise((resolve, reject) => {
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (c) => (data += c));
		process.stdin.on("end", () => resolve(data));
		process.stdin.on("error", reject);
	});
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
