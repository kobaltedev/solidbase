import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import localSearchPlugin from "../../src/default-theme/vite-local-search.ts";
import { fixtureSiteRoot } from "../helpers/fixtures.ts";

describe("localSearchPlugin", () => {
	it("returns no plugin when local search is disabled", () => {
		expect(localSearchPlugin({ themeConfig: {} } as any)).toEqual([]);
	});

	it("writes a Pagefind search bundle", async () => {
		const plugin = localSearchPlugin({
			themeConfig: { search: { local: true } },
			markdown: {},
			lang: "en-US",
		} as any) as any;
		plugin.configResolved({ root: fixtureSiteRoot });
		await plugin.buildStart.call({
			addWatchFile() {},
			resolve: async () => null,
		});

		const bundleDir = join(
			fixtureSiteRoot,
			"node_modules",
			".solidbase",
			"local-search",
			"pagefind",
		);
		await expect(
			access(join(bundleDir, "pagefind.js")),
		).resolves.toBeUndefined();
		expect(
			await readFile(join(bundleDir, "pagefind-entry.json"), "utf8"),
		).toContain('"languages"');
	});
});
