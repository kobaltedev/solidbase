export type SidebarConfig = Sidebar | Record<`/${string}`, Sidebar>;

export interface SidebarLink {
	title: string;
	link: string;
}

export interface SidebarItem {
	title: string;
	collapsed: boolean;
	items: (SidebarItem | SidebarLink)[];
}

export type Sidebar = {
	headerTitle?: string;
	items: SidebarItem[];
};
