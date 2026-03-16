import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

function setSolidBaseConfig(value: Record<string, unknown>) {
	const store = ((globalThis as any).__solidBaseConfig ??= {}) as Record<
		string,
		unknown
	>;
	for (const key of Object.keys(store)) delete store[key];
	Object.assign(store, value);
}

vi.mock("../../src/client/locale.ts", () => ({
	useLocale: () => ({
		currentLocale: () => ({
			config: {
				themeConfig: {
					nav: { title: "Localized" },
				},
			},
		}),
	}),
}));

describe("route config helper", () => {
	afterEach(() => {
		setSolidBaseConfig({});
		vi.resetModules();
	});

	it("merges locale theme config over the base config", async () => {
		setSolidBaseConfig({
			title: "Docs",
			themeConfig: {
				nav: { title: "Default" },
				sidebar: { "/": [] },
			},
		});

		const { useRouteSolidBaseConfig } = await import(
			"../../src/client/config.ts"
		);

		createRoot((dispose) => {
			const config = useRouteSolidBaseConfig<any>();

			expect(config()).toMatchObject({
				title: "Docs",
				themeConfig: {
					nav: { title: "Localized" },
					sidebar: { "/": [] },
				},
			});
			dispose();
		});
	});
});
