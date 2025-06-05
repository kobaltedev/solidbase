export type SidebarConfig<Item = SidebarItem> =
	| Item[]
	| Record<`/${string}`, Item[]>;

export type SidebarItem<T = {}> = T & (SidebarItemLink | SidebarItemSection<T>);

export interface SidebarItemLink {
	title: string;
	link: string;
	target?: string;
	rel?: string;
}

export interface SidebarItemSection<T = {}> {
	title: string;
	items: SidebarItem<T>[];
	collapsed?: boolean;
	base?: string;
}
