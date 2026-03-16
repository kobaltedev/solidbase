import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"virtual:solidbase/config": resolve(
				__dirname,
				"tests/mocks/virtual-solidbase-config.ts",
			),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
