import Unfonts from "unplugin-fonts/vite"

import { type ThemeDefinition, defineTheme } from "../config/index.js";

export type DefaultThemeConfig = {
	footer?: boolean;
	socialLinks?:
		| Record<Exclude<SocialLink["type"], "custom">, string>
		| Record<string, Omit<SocialLink, "type">>;
	nav?: Array<NavItem>;
	sidebar?: Sidebar | Record<`/${string}`, Sidebar>;
	search?: SearchConfig;
	fonts?: boolean;
};

const defaultTheme: ThemeDefinition<DefaultThemeConfig> = defineTheme({
	componentsPath: import.meta.resolve("@kobalte/solidbase/default-theme"),
	vite() {
		return [
			Unfonts({
				google: {
					families: [
						{ name: "Inter", styles: "ital,wght@0,100..900" },
						{ name: "Lexend", styles: "wght@100..900" },
						{ name: "JetBrains+Mono", styles: "ital,wght@0,100..900" },
					]
				}
			})
		];
	},
});
export default defaultTheme;

export type SearchConfig = {
	provider: "algolia";
	options: DocSearchOptions;
};
export interface DocSearchOptions {
	appId: string;
	apiKey: string;
	indexName: string;
}

export type NavItem = {
	text: string;
	link: string;
	activeMatch?: string;
};

export interface SidebarLink {
	title: string;
	link: string;
}

export interface SidebarItem {
	title: string;
	collapsed: boolean;
	items: (SidebarItem | SidebarLink)[];
}

export interface SocialLink {
	type: "discord" | "github" | "opencollective" | "custom";
	link: string;
	logo?: string;
	label?: string;
}

export type Sidebar = {
	headerTitle?: string;
	items: SidebarItem[];
};
