import { join } from "node:path";
import * as pagefind from "pagefind";
import type { PluginOption } from "vite";
import type { SolidBaseResolvedConfig } from "../config/index.js";
import {
	createGeneratedAssetPlugin,
	emptyDir,
} from "../config/vite-plugin/generated-asset.js";
import { buildLocalSearchRecords } from "./search-index.js";

const LOCAL_SEARCH_ASSETS_DIR = join(
	"node_modules",
	".solidbase",
	"local-search",
);
let writeQueue = Promise.resolve();

function assertNoPagefindErrors(errors: string[]) {
	if (errors.length > 0) throw new Error(errors.join("\n"));
}

async function writePagefindAssets(
	root: string,
	config: SolidBaseResolvedConfig<any>,
	resolver: (
		source: string,
		importer: string,
	) => Promise<{ id: string } | null>,
	watch: (filePath: string) => void,
) {
	const outputRoot = join(root, LOCAL_SEARCH_ASSETS_DIR);
	await emptyDir(outputRoot);

	try {
		const created = await pagefind.createIndex();
		assertNoPagefindErrors(created.errors);
		if (!created.index) throw new Error("Pagefind did not create an index");

		const records = await buildLocalSearchRecords(
			root,
			config,
			resolver,
			watch,
		);
		for (const record of records) {
			const added = await created.index.addCustomRecord(record);
			assertNoPagefindErrors(added.errors);
		}

		const written = await created.index.writeFiles({
			outputPath: join(outputRoot, "pagefind"),
		});
		assertNoPagefindErrors(written.errors);
	} finally {
		await pagefind.close();
	}
}

export default function localSearchPlugin(
	config: SolidBaseResolvedConfig<any>,
): PluginOption {
	if (config.themeConfig?.search?.local !== true) return [];

	return createGeneratedAssetPlugin({
		name: "solidbase:local-search",
		assetDir: LOCAL_SEARCH_ASSETS_DIR,
		write(root, resolver, watch) {
			const write = () => writePagefindAssets(root, config, resolver, watch);
			const queued = writeQueue.then(write, write);
			writeQueue = queued.then(
				() => undefined,
				() => undefined,
			);
			return queued;
		},
	});
}
