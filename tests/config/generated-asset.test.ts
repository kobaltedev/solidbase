import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGeneratedAssetPlugin } from "../../src/config/vite-plugin/generated-asset.ts";

const tempDirs: string[] = [];

describe("createGeneratedAssetPlugin", () => {
	afterEach(async () => {
		await Promise.all(
			tempDirs
				.splice(0)
				.map((dir) => rm(dir, { recursive: true, force: true })),
		);
	});

	it("serves generated JavaScript as an ES module", async () => {
		const root = await mkdtemp(join(tmpdir(), "solidbase-assets-"));
		tempDirs.push(root);
		const assetDir = join("generated", "pagefind");
		await mkdir(join(root, assetDir), { recursive: true });
		await writeFile(join(root, assetDir, "pagefind.js"), "export {};", "utf8");

		const plugin = createGeneratedAssetPlugin({
			name: "test-assets",
			assetDir: "generated",
			async write() {},
		}) as any;
		plugin.configResolved({ root });

		let middleware: any;
		plugin.configureServer({
			middlewares: { use: (handler: any) => (middleware = handler) },
		});
		const setHeader = vi.fn();

		await new Promise<void>((resolve, reject) => {
			middleware(
				{ url: "/pagefind/pagefind.js" },
				{ setHeader, end: resolve },
				() => reject(new Error("Asset was not served")),
			);
		});

		expect(setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"text/javascript; charset=utf-8",
		);
	});

	it("regenerates assets when a watched source changes", async () => {
		const source = "/docs/src/routes/index.mdx";
		const write = vi.fn(async (_root, _resolve, watch) => watch(source));
		const plugin = createGeneratedAssetPlugin({
			name: "test-assets",
			assetDir: "generated",
			write,
		}) as any;
		const context = {
			addWatchFile: vi.fn(),
			resolve: vi.fn(),
		};

		await plugin.buildStart.call(context);
		await plugin.watchChange.call(context, source);

		expect(write).toHaveBeenCalledTimes(2);
	});
});
