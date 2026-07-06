import {
	createFilesystemSidebar,
	type FilesystemSidebarOptions,
	type SidebarItem,
	type SidebarItemWithMeta,
} from "../config/sidebar.js";

export type DefaultThemeSidebarItemOptions = {
	status?:
		| "new"
		| "updated"
		| "next"
		| DefaultThemeSidebarItemOptionCustomStatus;
};

export interface DefaultThemeSidebarItemOptionCustomStatus {
	text: string;
	color: string;
	textColor?: string;
}

export type DefaultThemeSidebarItem =
	SidebarItem<DefaultThemeSidebarItemOptions>;

export function createDefaultThemeFilesystemSidebar<
	Item extends DefaultThemeSidebarItem,
>(route: string, options?: FilesystemSidebarOptions): Item[] {
	return createFilesystemSidebar(route, {
		transform: (item) => {
			const i = item as SidebarItemWithMeta & Item;
			if ("sidebarStatus" in item.matterData)
				i.status = item.matterData.sidebarStatus;
			else if ("status" in item.matterData) i.status = item.matterData.status;
			return i;
		},
		...options,
	});
}
