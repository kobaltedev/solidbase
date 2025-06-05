import { createContextProvider } from "@solid-primitives/context";
import { useLocation } from "@solidjs/router";
import { type Accessor, createMemo } from "solid-js";

import type { SidebarConfig, SidebarItem } from "../config/sidebar";
import { useLocale } from "./locale";

export type * from "../config/sidebar";

const [SidebarProvider, useSidebarRaw] = createContextProvider(
	(props: { config?: SidebarConfig }) => {
		const locale = useLocale();

		const sidebars = createMemo(() => {
			const sidebarConfig = props.config;
			if (!sidebarConfig) return;

			if (Array.isArray(sidebarConfig)) {
				return { "/": sidebarConfig };
			}

			return sidebarConfig;
		});

		const sidebar = createMemo(() => {
			const s = sidebars();
			if (!s) return;

			const sidebarsEntries = Object.entries(s);
			if (sidebarsEntries.length === 1) {
				const [prefix, sidebar] = sidebarsEntries[0];
				return { prefix, items: sidebar };
			}

			sidebarsEntries.sort(([a], [b]) => b.length - a.length);

			for (const [prefix, sidebar] of sidebarsEntries) {
				if (locale.routePath().startsWith(prefix))
					return { prefix, items: sidebar };
			}
		});

		return sidebar;
	},
);

export { SidebarProvider };

export function useSidebar<T = {}>() {
	const s = useSidebarRaw();
	if (!s)
		throw new Error("useSidebar must be called underneath a SidebarProvider");
	return s as Accessor<{ prefix: string; items: SidebarItem<T>[] }>;
}

function flattenSidebarItems<T = {}>(
	sidebar: { prefix: string; items: SidebarItem<T>[] },
	depth = 0,
): Array<SidebarItem<T> & { depth: number }> {
	return sidebar.items.flatMap((item) => {
		if ("link" in item)
			return {
				target: (() => {
					if (item.link.includes("//")) return "_blank";
				})(),
				rel: (() => {
					if (item.link.includes("//") || item.target === "_blank")
						return "noopener noreferrer";
				})(),
				...item,
				link: (() => {
					if (sidebar.prefix === "/") return item.link;

					if (item.link.endsWith("/"))
						return `${sidebar.prefix}${item.link.slice(0, -1)}`;
					return `${sidebar.prefix}${item.link}`;
				})(),
				depth,
			};

		return flattenSidebarItems<T>(
			{ prefix: sidebar.prefix + (item.base ?? ""), items: item.items },
			depth + 1,
		);
	});
}

export function usePrevNext<T = {}>() {
	const sidebar = useSidebar<T>();

	const links = createMemo(() => {
		const s = sidebar();
		if (!s) return [];
		return flattenSidebarItems<T>(s);
	});

	const location = useLocation();

	const index = createMemo(() => {
		const s = sidebar();
		if (!s) return -1;

		return links().findIndex(
			(item) => "link" in item && location.pathname === item.link,
		);
	});

	return {
		prevLink: () => links()[index() - 1],
		nextLink: () => links()[index() + 1],
	};
}
