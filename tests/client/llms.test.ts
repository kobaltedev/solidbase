// @vitest-environment jsdom

import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

async function flushMicrotasks(count = 4) {
	for (let i = 0; i < count; i++) {
		await Promise.resolve();
	}
}

async function waitForReady(check: () => boolean | undefined, attempts = 8) {
	for (let i = 0; i < attempts; i++) {
		if (check()) return;
		await Promise.resolve();
	}
}

function setSolidBaseConfig(value: Record<string, unknown>) {
	const store = ((globalThis as any).__solidBaseConfig ??= {}) as Record<
		string,
		unknown
	>;
	for (const key of Object.keys(store)) delete store[key];
	Object.assign(store, value);
}

const useCurrentMatches = vi.fn();
const useLocation = vi.fn();

vi.mock("@solidjs/router", () => ({
	useCurrentMatches,
	useLocation,
}));

vi.mock("../../src/client/config.ts", () => ({
	useRouteSolidBaseConfig: () => () =>
		((globalThis as any).__solidBaseConfig ?? {}) as Record<string, unknown>,
}));

vi.mock("../../src/client/page-data.ts", () => ({
	useCurrentPageData: () => () => {
		const pageData = (window as any).$$SolidBase_page_data ?? {};
		return Object.values(pageData)[0];
	},
}));

describe("llms client helpers", () => {
	const pagePath = "tests/fixtures/page.mdx";

	afterEach(() => {
		useCurrentMatches.mockReset();
		useLocation.mockReset();
		vi.doUnmock("solid-js");
		vi.restoreAllMocks();
		vi.resetModules();
		setSolidBaseConfig({});
		(window as any).$$SolidBase_page_data = undefined;
		delete (globalThis as any).fetch;
		delete (globalThis as any).navigator;
	});

	it("treats llms false as not copyable", async () => {
		const { canCopyPageMarkdown } = await import("../../src/client/page-markdown.ts");

		expect(canCopyPageMarkdown(true, false)).toBe(false);
		expect(canCopyPageMarkdown(true, { exclude: true })).toBe(false);
		expect(canCopyPageMarkdown(true, undefined)).toBe(true);
		expect(canCopyPageMarkdown(false, undefined)).toBe(false);
	});

	it("caches fetched markdown by path", async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			text: async () => "# Home",
		}));

		const { clearPageMarkdownCache, getCurrentPageMarkdown } = await import(
			"../../src/client/page-markdown.ts"
		);

		clearPageMarkdownCache();

		await expect(
			getCurrentPageMarkdown("/guide/getting-started", fetchMock as any),
		).resolves.toBe("# Home");
		await expect(
			getCurrentPageMarkdown("/guide/getting-started", fetchMock as any),
		).resolves.toBe("# Home");

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith("/guide/getting-started.md", {
			headers: { Accept: "text/plain" },
		});
	});

	it("provides shared copy state for themes", async () => {
		setSolidBaseConfig({ llms: true, themeConfig: {} });
		useLocation.mockReturnValue({ pathname: "/guide/getting-started" });
		useCurrentMatches.mockReturnValue([
			{
				route: { key: { $component: { src: `${pagePath}?import` } } },
			},
		]);
		(window as any).$$SolidBase_page_data = {
			[pagePath]: {
				frontmatter: { title: "Hello" },
			},
		};

		window.history.replaceState({}, "", "/guide/getting-started");

		(globalThis as any).fetch = vi.fn(async () => ({
			ok: true,
			text: async () => "# Getting Started",
		}));
		(globalThis as any).navigator = {
			clipboard: {
				writeText: vi.fn(async () => undefined),
			},
		};

		const { clearPageMarkdownCache, useCopyPageMarkdown } = await import(
			"../../src/client/page-markdown.ts"
		);

		clearPageMarkdownCache();

		let api: ReturnType<typeof useCopyPageMarkdown> | undefined;

		const dispose = createRoot((dispose) => {
			api = useCopyPageMarkdown();
			return dispose;
		});

		await flushMicrotasks();

		expect(api?.canCopy()).toBe(true);
		expect(api?.isReady()).toBe(false);
		await expect(api?.copy()).resolves.toBe(false);
		expect((globalThis as any).fetch).not.toHaveBeenCalled();

		dispose();
	});

	it("enables copying after client mount", async () => {
		setSolidBaseConfig({ llms: true, themeConfig: {} });
		useLocation.mockReturnValue({ pathname: "/guide/getting-started" });
		useCurrentMatches.mockReturnValue([
			{
				route: { key: { $component: { src: `${pagePath}?import` } } },
			},
		]);
		(window as any).$$SolidBase_page_data = {
			[pagePath]: {
				frontmatter: { title: "Hello" },
			},
		};

		window.history.replaceState({}, "", "/guide/getting-started");

		(globalThis as any).fetch = vi.fn(async () => ({
			ok: true,
			text: async () => "# Getting Started",
		}));
		(globalThis as any).navigator = {
			clipboard: {
				writeText: vi.fn(async () => undefined),
			},
		};

		vi.doMock("solid-js", async () =>
			vi.importActual<typeof import("solid-js/dist/solid.cjs")>(
				"solid-js/dist/solid.cjs",
			),
		);

		const { render } = await import("solid-js/web/dist/web.cjs");
		const { clearPageMarkdownCache, useCopyPageMarkdown } = await import(
			"../../src/client/page-markdown.ts"
		);

		clearPageMarkdownCache();

		let api: ReturnType<typeof useCopyPageMarkdown> | undefined;
		const container = document.createElement("div");
		document.body.append(container);

		const dispose = render(() => {
			api = useCopyPageMarkdown();
			return null;
		}, container);

		await flushMicrotasks();

		expect(api?.canCopy()).toBe(true);
		expect(api?.isReady()).toBe(true);
		await expect(api?.copy()).resolves.toBe(true);
		expect(api?.state()).toBe("success");
		expect(
			(globalThis as any).navigator.clipboard.writeText,
		).toHaveBeenCalledWith("# Getting Started");

		dispose();
		container.remove();
	});

	it("resets copy feedback when navigation changes mid-copy", async () => {
		setSolidBaseConfig({ llms: true, themeConfig: {} });
		vi.doMock("solid-js", async () =>
			vi.importActual<typeof import("solid-js/dist/solid.cjs")>(
				"solid-js/dist/solid.cjs",
			),
		);
		const { createSignal } = await import("solid-js");
		const [pathname, setPathname] = createSignal("/guide/getting-started");
		useLocation.mockReturnValue({
			get pathname() {
				return pathname();
			},
		});
		useCurrentMatches.mockReturnValue([
			{
				route: { key: { $component: { src: `${pagePath}?import` } } },
			},
		]);
		(window as any).$$SolidBase_page_data = {
			[pagePath]: {
				frontmatter: { title: "Hello" },
			},
		};

		window.history.replaceState({}, "", "/guide/getting-started");

		let resolveFetch: ((value: any) => void) | undefined;
		(globalThis as any).fetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolveFetch = resolve;
				}),
		);
		(globalThis as any).navigator = {
			clipboard: {
				writeText: vi.fn(async () => undefined),
			},
		};

		const { render } = await import("solid-js/web/dist/web.cjs");
		const { clearPageMarkdownCache, useCopyPageMarkdown } = await import(
			"../../src/client/page-markdown.ts"
		);

		clearPageMarkdownCache();

		let api: ReturnType<typeof useCopyPageMarkdown> | undefined;
		const container = document.createElement("div");
		document.body.append(container);

		const dispose = render(() => {
			api = useCopyPageMarkdown();
			return null;
		}, container);

		await flushMicrotasks();
		await waitForReady(() => api?.isReady());

		expect(api?.isReady()).toBe(true);

		const copyPromise = api?.copy();
		expect(api?.isCopying()).toBe(true);

		setPathname("/guide/customization/extending-themes");
		await Promise.resolve();
		await Promise.resolve();

		expect(api?.state()).toBe("idle");
		expect(api?.isCopying()).toBe(false);

		resolveFetch?.({
			ok: true,
			text: async () => "# Getting Started",
		});

		await expect(copyPromise).resolves.toBe(false);
		expect(api?.state()).toBe("idle");
		expect(
			(globalThis as any).navigator.clipboard.writeText,
		).not.toHaveBeenCalled();

		dispose();
		container.remove();
	});
});
