import { afterEach, describe, expect, it, vi } from "vitest";

function setSolidBaseConfig(value: Record<string, unknown>) {
	const store = ((globalThis as any).__solidBaseConfig ??= {}) as Record<
		string,
		unknown
	>;
	for (const key of Object.keys(store)) delete store[key];
	Object.assign(store, value);
}

const ComponentIcon = (props: { class?: string }) => (
	<svg
		data-testid="component-icon"
		viewBox="0 0 10 10"
		fill="currentColor"
		class={props.class}
	>
		<circle cx="5" cy="5" r="4" />
	</svg>
);

describe("PageActions", () => {
	afterEach(() => {
		setSolidBaseConfig({});
		vi.doUnmock("../../src/default-theme/utils.js");
		vi.resetModules();
	});

	it("renders linked and static badges with configured icons", async () => {
		setSolidBaseConfig({
			themeConfig: {
				actions: {
					icons: {
						npm: `<svg data-testid="svg-icon" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" /></svg>`,
						gh: ComponentIcon,
					},
				},
			},
		});

		vi.doMock("../../src/default-theme/utils.js", () => ({
			useRouteConfig: () => () =>
				((globalThis as any).__solidBaseConfig ?? {}) as Record<
					string,
					unknown
				>,
		}));

		const { renderToString } = await import("solid-js/web");
		const { default: PageActions } = await import(
			"../../src/default-theme/components/PageActions.tsx"
		);

		const html = renderToString(() => (
			<PageActions
				actions={[
					{ icon: "npm", label: "0.13.11" },
					{
						icon: "gh",
						label: "source",
						url: "https://github.com/kobaltedev/solidbase",
					},
					{ icon: "missing", label: "fallback" },
				]}
			/>
		));

		expect(html).toContain("0.13.11");
		expect(html).toContain("source");
		expect(html).toContain("fallback");
		expect(html).toContain('data-testid="svg-icon"');
		expect(html).toContain('data-testid="component-icon"');
		expect(html).toContain(
			'href="https://github.com/kobaltedev/solidbase"',
		);
		expect(html.match(/<a\b/g)?.length ?? 0).toBe(1);
	});

	it("renders nothing when there are no actions", async () => {
		vi.doMock("../../src/default-theme/utils.js", () => ({
			useRouteConfig: () => () =>
				((globalThis as any).__solidBaseConfig ?? {}) as Record<
					string,
					unknown
				>,
		}));

		const { renderToString } = await import("solid-js/web");
		const { default: PageActions } = await import(
			"../../src/default-theme/components/PageActions.tsx"
		);

		expect(renderToString(() => <PageActions actions={[]} />)).toBe("");
	});
});
