import { solidBaseConfig } from "virtual:solidbase";
import { useLocation } from "@solidjs/router";
import { Accessor, createEffect, createMemo } from "solid-js";
import type { Sidebar, SidebarItem, SidebarLink } from "../config";

export function useSidebar() {
	const sidebars = (() => {
		const sidebarConfig = solidBaseConfig.sidebar;
		if (!sidebarConfig) return;
		if (Object.keys(sidebarConfig).length === 0) return;

		if ("items" in sidebarConfig) return { "/": sidebarConfig };
		return sidebarConfig;
	})();

	const location = useLocation();

	const sidebar = createMemo(() => {
		if (!sidebars) return;

		const sidebarsEntries = Object.entries(sidebars);
		if (sidebarsEntries.length === 1) {
			const [prefix, sidebar] = sidebarsEntries[0];
			return { prefix, ...sidebar };
		}

		sidebarsEntries.sort((a, b) => b[0].length - a[0].length);

		for (const [prefix, sidebar] of sidebarsEntries) {
			if (location.pathname.startsWith(prefix)) return { prefix, ...sidebar };
		}
	});

	return sidebar;
}

export type FlattenedSidebarLink = SidebarLink & { depth: number };

export function flattenSidebarItems(
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
	const sidebar = useSidebar();

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
