import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn<() => string>(() => "/guide/install");
const routePath = vi.fn<() => string>(() => "/guide/install");

vi.mock("@solidjs/router", () => ({
	useLocation: () => ({
		get pathname() {
			return pathname();
		},
	}),
}));

vi.mock("../../src/client/locale.ts", () => ({
	useLocale: () => ({
		routePath,
	}),
}));

describe("client sidebar helpers", () => {
	afterEach(() => {
		pathname.mockReset();
		pathname.mockReturnValue("/guide/install");
		routePath.mockReset();
		routePath.mockReturnValue("/guide/install");
		vi.resetModules();
	});

	it("selects the longest matching sidebar prefix", async () => {
		const { SidebarProvider, useSidebar } = await import(
			"../../src/client/sidebar.ts"
		);

		createRoot((dispose) => {
			let value: ReturnType<ReturnType<typeof useSidebar>> | undefined;
			SidebarProvider({
				config: {
					"/guide": [{ title: "Guide", link: "/intro" }],
					"/guide/install": [{ title: "Install", link: "/" }],
				},
				get children() {
					value = useSidebar()();
					return null;
				},
			} as any);

			expect(value).toEqual({
				prefix: "/guide/install",
				items: [{ title: "Install", link: "/" }],
			});
			dispose();
		});
	});

	it("flattens nested sections and computes prev/next links", async () => {
		pathname.mockReturnValue("/guide/nested/install");
		routePath.mockReturnValue("/guide/nested/install");

		const { SidebarProvider, usePrevNext } = await import(
			"../../src/client/sidebar.ts"
		);

		createRoot((dispose) => {
			let value: ReturnType<typeof usePrevNext> | undefined;
			SidebarProvider({
				config: {
					"/guide": [
						{ title: "Intro", link: "/intro" },
						{
							title: "Section",
							base: "/nested",
							items: [
								{ title: "Install", link: "/install" },
								{ title: "External", link: "https://example.com" },
							],
						},
					],
				},
				get children() {
					value = usePrevNext() as any;
					return null;
				},
			} as any);

			expect(value).toBeDefined();
			expect(value!.prevLink()).toMatchObject({
				title: "Intro",
				link: "/guide/intro",
				depth: 0,
			});
			expect(value!.nextLink()).toMatchObject({
				title: "External",
				link: "https://example.com",
				target: "_blank",
				rel: "noopener noreferrer",
				depth: 1,
			});
			dispose();
		});
	});

	it("supports legacy section-shaped sidebar config objects", async () => {
		const { SidebarProvider, useSidebar } = await import(
			"../../src/client/sidebar.ts"
		);

		createRoot((dispose) => {
			let value: ReturnType<ReturnType<typeof useSidebar>> | undefined;

			SidebarProvider({
				config: {
					"/guide": {
						title: "Guide",
						items: [{ title: "Intro", link: "/intro" }],
					},
				},
				get children() {
					value = useSidebar()();
					return null;
				},
			} as any);

			expect(value).toEqual({
				prefix: "/guide",
				items: [{ title: "Intro", link: "/intro" }],
			});
			dispose();
		});
	});

});
