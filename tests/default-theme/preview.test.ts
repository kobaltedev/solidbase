import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createComponent } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

const tempDirs: string[] = [];

async function resolvePnpmPackagePath(prefix: string, subpath: string) {
	const pnpmDir = resolve(__dirname, "../../node_modules/.pnpm");
	const entry = (await readdir(pnpmDir)).find((name) =>
		name.startsWith(prefix),
	);

	if (!entry) {
		throw new Error(`Missing pnpm package for ${prefix}`);
	}

	return resolve(pnpmDir, entry, subpath);
}

async function loadPreviewComponents() {
	const outdir = await mkdtemp(join(tmpdir(), "solidbase-preview-test-"));
	tempDirs.push(outdir);

	const [babelCore, solidBabelPlugin, esbuild] = await Promise.all([
		import(
			pathToFileURL(
				await resolvePnpmPackagePath(
					"@babel+core@",
					"node_modules/@babel/core/lib/index.js",
				),
			).href
		),
		import(
			pathToFileURL(
				await resolvePnpmPackagePath(
					"@solidjs+babel-plugin@",
					"node_modules/@solidjs/babel-plugin/index.js",
				),
			).href
		),
		import("esbuild"),
	]);

	const entryPath = resolve(
		__dirname,
		"../../src/default-theme/components/Preview.tsx",
	);
	const source = await readFile(entryPath, "utf8");
	// esbuild strips the TypeScript (JSX preserved); the Solid babel plugin then compiles the JSX.
	const stripped = await esbuild.transform(
		source.replace(
			'import styles from "../mdx-components.module.css";',
			"const styles = new Proxy({}, { get: (_, key) => String(key) });",
		),
		{ loader: "tsx", jsx: "preserve", format: "esm", target: "esnext" },
	);
	const transformed = await babelCore.transformAsync(stripped.code, {
		filename: entryPath,
		babelrc: false,
		configFile: false,
		sourceMaps: false,
		parserOpts: { plugins: ["jsx"] },
		plugins: [
			[solidBabelPlugin.default, { generate: "ssr", hydratable: false }],
		],
	});

	if (!transformed?.code) {
		throw new Error("Failed to transform Preview.tsx for test runtime");
	}

	const outfile = join(outdir, "Preview.mjs");
	await writeFile(outfile, transformed.code, "utf8");

	return import(pathToFileURL(outfile).href);
}

describe("default theme preview components", () => {
	afterEach(async () => {
		await Promise.all(
			tempDirs
				.splice(0)
				.map((dir) => rm(dir, { recursive: true, force: true })),
		);
	});

	it("renders a preview-only shell with a stage", async () => {
		const { renderToString } = await import("@solidjs/web");
		const { Preview, PreviewStage } = await loadPreviewComponents();

		const html = renderToString(() =>
			createComponent(Preview, {
				get children() {
					return createComponent(PreviewStage, {
						children: "Preview me",
					});
				},
			}),
		);

		expect(html).toContain("data-preview-root");
		expect(html).toContain("data-preview-stage");
		expect(html).not.toContain("data-preview-panel");
		expect(html).toContain("Preview me");
	});

	it("renders a two-panel shell without altering panel content", async () => {
		const { renderToString } = await import("@solidjs/web");
		const { Preview, PreviewPanel, PreviewStage } =
			await loadPreviewComponents();

		const html = renderToString(() =>
			createComponent(Preview, {
				get children() {
					return [
						createComponent(PreviewStage, {
							children: "Stage content",
						}),
						createComponent(PreviewPanel, {
							children: "Panel body",
						}),
					];
				},
			}),
		);

		expect(html).toContain("data-preview-root");
		expect(html).toContain("data-preview-stage");
		expect(html).toContain("data-preview-panel");
		expect(html).toContain("Stage content");
		expect(html).toContain("Panel body");
	});
});
