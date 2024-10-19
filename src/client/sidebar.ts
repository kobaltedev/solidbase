import { useLocation } from "@solidjs/router";
import { createMemo } from "solid-js";
import { solidBaseConfig } from "virtual:solidbase";
import { Sidebar, SidebarItem, SidebarLink } from "../config";

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
    if (sidebarsEntries.length === 1) return sidebarsEntries[0][1];

    sidebarsEntries.sort((a, b) => b[0].length - a[0].length);

    for (const [prefix, sidebar] of sidebarsEntries) {
      if (location.pathname.startsWith(prefix)) return sidebar;
    }
  });

  return sidebar;
}

export type FlattenedSidebarLink = SidebarLink & { depth: number };

export function flattenSidebarItems(
  sidebar: Sidebar,
): Array<SidebarLink & { depth: number }> {
  function recursivelyFlattenItemLinks(
    item: SidebarItem,
    acc: Array<FlattenedSidebarLink> = [],
    depth = 0,
  ) {
    for (const subItem of item.items) {
      if ("link" in subItem) acc.push({ ...subItem, depth });
      else recursivelyFlattenItemLinks(subItem, acc, depth + 1);
    }
  }

  const ret: Array<FlattenedSidebarLink> = [];

  sidebar.items.forEach((item) => recursivelyFlattenItemLinks(item, ret));

  return ret;
}
