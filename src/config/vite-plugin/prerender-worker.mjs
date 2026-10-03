// Runs in a child process so the production server bundle never loads into Vite's process
// (its runtime holds handles that keep the event loop alive and hang `vite build`).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const STATIC_FILE_RE = /\.[a-z0-9]{1,8}$/i;
const HREF_RE = /\shref=(?:"([^"]*)"|'([^']*)')/g;
const NOT_FOUND_PROBE = "/__solidbase_404__";

function toOutputFile(outDir, path) {
	const clean = path.split("?")[0].split("#")[0];
	if (STATIC_FILE_RE.test(clean) && !clean.endsWith("/"))
		return join(outDir, clean);
	return join(outDir, clean, "index.html");
}

function extractLinks(html, origin) {
	const links = new Set();
	for (const match of html.matchAll(HREF_RE)) {
		const raw = match[1] ?? match[2] ?? "";
		if (!raw || raw.startsWith("#") || raw.startsWith("mailto:")) continue;
		let url;
		try {
			url = new URL(raw, origin);
		} catch {
			continue;
		}
		if (url.origin !== origin) continue;
		if (STATIC_FILE_RE.test(url.pathname) && !url.pathname.endsWith(".html"))
			continue;
		links.add(url.pathname);
	}
	return links;
}

async function main() {
	const input = JSON.parse(await readStdin());
	const { serverEntry, outDir, origin, seeds, crawlLinks, notFound } = input;
	const mod = await import(pathToFileURL(serverEntry).href);
	const handleRequest =
		mod.handleRequest ?? mod.default?.fetch?.bind(mod.default);
	if (!handleRequest)
		throw new Error(`${serverEntry} does not export handleRequest`);

	const render = async (path) => {
		const res = await handleRequest(new Request(new URL(path, origin)), {
			renderMode: "async",
		});
		return { status: res.status, html: await res.text() };
	};

	const queue = [...seeds];
	const seen = new Set();
	const written = [];
	const failed = [];
	while (queue.length) {
		const path = queue.shift();
		if (seen.has(path)) continue;
		seen.add(path);
		const { status, html } = await render(path);
		if (status !== 200) {
			failed.push({ path, status });
			continue;
		}
		const file = toOutputFile(outDir, path);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, html);
		written.push(path);
		if (crawlLinks)
			for (const link of extractLinks(html, origin)) queue.push(link);
	}
	if (notFound) {
		const { html } = await render(NOT_FOUND_PROBE);
		await writeFile(join(outDir, "404.html"), html);
	}
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
