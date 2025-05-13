import { createContextProvider } from "@solid-primitives/context";
import { useLocation } from "@solidjs/router";
import { createMemo } from "solid-js";

import type {
	Sidebar,
	SidebarConfig,
	SidebarItem,
	SidebarLink,
} from "../config/sidebar";
import { useLocale } from "./locale";

export type * from "../config/sidebar"

const [SidebarProvider, useSidebarRaw] = createContextProvider(
	(props: { config?: SidebarConfig }) => {
		const locale = useLocale();

		const sidebars = createMemo(() => {
			const sidebarConfig = props.config;
			if (!sidebarConfig) return;

			if (Object.keys(sidebarConfig).length === 0) return;

			if ("items" in sidebarConfig) return { "/": sidebarConfig };
			return sidebarConfig;
		});

		const sidebar = createMemo(() => {
			const s = sidebars();
			if (!s) return;

			const sidebarsEntries = Object.entries(s);
			if (sidebarsEntries.length === 1) {
				const [prefix, sidebar] = sidebarsEntries[0];
				return { prefix, ...sidebar };
			}

			sidebarsEntries.sort((a, b) => b[0].length - a[0].length);

			for (const [prefix, sidebar] of sidebarsEntries) {
				if (locale.routePath().startsWith(prefix))
					return { prefix, ...sidebar };
			}
		});

		return sidebar;
	},
);

export { SidebarProvider };

export function useSidebar() {
	const s = useSidebarRaw();
	if (!s)
		throw new Error("useSidebar must be called underneath a SidebarProvider");
	return s;
}

type FlattenedSidebarLink = SidebarLink & { depth: number };

function flattenSidebarItems(
	sidebar: Sidebar & { prefix?: string },
): Array<SidebarLink & { depth: number }> {
	function recursivelyFlattenItemLinks(
		item: SidebarItem,
		acc: Array<FlattenedSidebarLink> = [],
		depth = 0,
	) {
		for (const subItem of item.items) {
			if ("link" in subItem)
				acc.push({
					...subItem,
					link: (() => {
						if (!sidebar.prefix || sidebar.prefix === "/") return subItem.link;

						if (subItem.link.endsWith("/"))
							return `${sidebar.prefix}${subItem.link.slice(0, -1)}`;
						return `${sidebar.prefix}${subItem.link}`;
					})(),
					depth,
				});
			else recursivelyFlattenItemLinks(subItem, acc, depth + 1);
		}
	}

	const ret: Array<FlattenedSidebarLink> = [];

	for (const item of sidebar.items) {
		recursivelyFlattenItemLinks(item, ret);
	}

	return ret;
}

export function usePrevNext() {
	const sidebar = useSidebarRaw();
	if (!sidebar)
		throw new Error("usePrevNext must be called underneath a SidebarProvider");

	const links = createMemo(() => {
		const s = sidebar();
		if (!s) return [];
		return flattenSidebarItems(s);
	});

	const location = useLocation();

	const index = createMemo(() => {
		const s = sidebar();
		if (!s) return -1;

		return links().findIndex(({ link }) => location.pathname === link);
	});

	return {
		prevLink: () => links()[index() - 1],
		nextLink: () => links()[index() + 1],
	};
}
