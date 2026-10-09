import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
	"virtual:solidbase/config": resolve(
		__dirname,
		"tests/mocks/virtual-solidbase-config.ts",
	),
};

// Tests that render on the client. Solid 2 ships separate server/browser builds selected by
// package export conditions, so these run in a project that resolves the "browser" condition.
const jsdomTests = [
	"tests/client/llms.test.ts",
	"tests/client/locale.test.ts",
	"tests/client/page-data.test.ts",
	"tests/client/theme.test.ts",
];

export default defineConfig({
	resolve: { alias },
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: "node",
					environment: "node",
					include: ["tests/**/*.test.ts"],
					exclude: ["**/node_modules/**", ...jsdomTests],
				},
			},
			{
				extends: true,
				resolve: { conditions: ["browser"] },
				test: {
					name: "jsdom",
					environment: "jsdom",
					include: jsdomTests,
				},
			},
		],
	},
});
