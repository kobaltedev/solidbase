import { lstatSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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

export type SidebarItemWithMeta<T = {}> = SidebarItem<T> & {
	filePath: string;
	matterData?: any;
};

export interface FilesystemSidebarOptions {
	filter?: (item: SidebarItemWithMeta) => boolean;
	sort?: (a: SidebarItemWithMeta, b: SidebarItemWithMeta) => number;
}

const ROUTES_FOLDER = import.meta
	.resolve("./src/routes/")
	.substring("file:".length);

export function createFilesystemSidebar<Item = SidebarItem>(
	route: string,
	options?: FilesystemSidebarOptions,
): Item[] {
	const folder = path.join(ROUTES_FOLDER, route);

	const resolvedOptions: Required<FilesystemSidebarOptions> = {
		filter: (item) => {
			return item.matterData?.excludeFromSidebar !== true;
		},
		sort: (a, b) => {
			if (stripExtension(a.filePath).endsWith("index")) return -1;
			if (a.filePath > b.filePath) return 1;
			if (b.filePath > a.filePath) return -1;
			return 0;
		},
		...options,
	};

	const items = readdirSync(folder)
		.flatMap((file) => {
			return traverse(path.join(folder, file), folder, resolvedOptions);
		})
		.filter(Boolean) as SidebarItemWithMeta[];

	const transform = (items: SidebarItemWithMeta[]): Item[] => {
		return items
			.filter(resolvedOptions.filter)
			.sort(resolvedOptions.sort)
			.map((item) => {
				if ("items" in item)
					return stripMeta({
						...item,
						items: transform(
							item.items as SidebarItemWithMeta[],
						) as SidebarItem[],
					});
				return stripMeta(item);
			}) as Item[];
	};

	return transform(items);
}

function traverse(
	filePath: string,
	baseFolder: string,
	options: Required<FilesystemSidebarOptions>,
): SidebarItemWithMeta | SidebarItemWithMeta[] | undefined {
	const title = formatTitle(path.basename(filePath));

	if (title.includes("[...")) return;

	if (lstatSync(filePath).isFile()) {
		const matterData = getMatterData(filePath);

		return {
			title: getMatterData(filePath).title ?? title,
			link: `/${removeParenthesesGroups(stripExtension(path.relative(baseFolder, filePath)))}`
				.replace(/\/index$/, "")
				.replaceAll("//", "/"),
			filePath,
			matterData,
		};
	}

	const items = readdirSync(filePath)
		.flatMap((file) => {
			return traverse(path.join(filePath, file), baseFolder, options);
		})
		.filter(Boolean) as SidebarItemWithMeta[];

	if (title === "") {
		return items;
	}

	return {
		title,
		items,
		filePath,
	};
}

function stripExtension(filePath: string): string {
	return `${path.parse(filePath).dir}/${path.parse(filePath).name}`;
}

function getMatterData(filePath: string): { title?: string } & {} {
	return matter.read(filePath).data;
}

function formatTitle(filePath: string): string {
	return removeParenthesesGroups(
		stripExtension(filePath)
			.substring(1)
			.split("-")
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
			.join(" "),
	);
}

function removeParenthesesGroups(s: string) {
	return s.replaceAll(/\((\w|-|_)+\)/g, "").replaceAll("//", "/");
}

function stripMeta(item: SidebarItemWithMeta): SidebarItem {
	const stripped = item as any;
	stripped.filePath = undefined;
	stripped.matterData = undefined;

	return item;
}
