import { fileURLToPath } from "node:url";

import { type ThemeDefinition, defineTheme } from "../config/index.js";
import type { SidebarConfig, SidebarItem } from "../config/sidebar.js";

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

export type DefaultThemeConfig = {
	footer?: boolean;
	socialLinks?: {
		[K in Exclude<SocialLink["type"], "custom"> | (string & {})]?:
			| string
			| Omit<SocialLink, "type">;
	};
	nav?: Array<NavItem>;
	sidebar?: SidebarConfig<DefaultThemeSidebarItem>;
	search?: SearchConfig;
	fonts?: { [K in keyof typeof allFonts]?: false } | false;
};

type Font = { cssPath: string; preloadFontPath: string; fontType: string };

const allFonts = {
	inter: {
		cssPath: import.meta.resolve("@fontsource-variable/inter"),
		preloadFontPath: import.meta.resolve(
			"@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
		),
		fontType: "woff2",
	},
	lexend: {
		cssPath: import.meta.resolve("@fontsource-variable/lexend"),
		preloadFontPath: import.meta.resolve(
			"@fontsource-variable/lexend/files/lexend-latin-wght-normal.woff2",
		),
		fontType: "woff2",
	},
	jetbrainsMono: {
		cssPath: import.meta.resolve("@fontsource-variable/jetbrains-mono"),
		preloadFontPath: import.meta.resolve(
			"@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
		),
		fontType: "woff2",
	},
} satisfies Record<string, Font>;

const defaultTheme: ThemeDefinition<DefaultThemeConfig> = defineTheme({
	componentsPath: import.meta.resolve("@kobalte/solidbase/default-theme"),
	vite(config) {
		const filteredFonts: Array<Font> = [];

		if (config?.themeConfig?.fonts !== false) {
			const fonts = config?.themeConfig?.fonts;
			for (const [font, paths] of Object.entries(allFonts)) {
				if (fonts?.[font as keyof typeof fonts] !== false)
					filteredFonts.push(paths);
			}
		}

		return [
			{
				name: "solidbase-default-theme-fonts",
				resolveId(id) {
					if (id.startsWith("virtual:solidbase/default-theme/fonts.css"))
						return "virtual:solidbase/default-theme/fonts.css";
					if (id.startsWith("virtual:solidbase/default-theme/fonts"))
						return "\0virtual:solidbase/default-theme/fonts";
				},
				load(id) {
					if (id.startsWith("virtual:solidbase/default-theme/fonts.css"))
						return filteredFonts
							.map(
								(font) =>
									`@import url(${fileURLToPath(font.cssPath, { windows: false })});`,
							)
							.join("\n");
					if (id.startsWith("\0virtual:solidbase/default-theme/fonts")) {
						const preloadFonts = filteredFonts.map((font, i) => {
							const pathIdent = `font_${i}`;
							return {
								pathIdent,
								import: `import ${pathIdent} from "${fileURLToPath(font.preloadFontPath, { windows: false })}?url";`,
								type: font.fontType,
							};
						});

						return `
							${preloadFonts.map((f) => f.import).join("\n")}

							export const preloadFonts = [
								${preloadFonts
									.map((f) => `{ path: ${f.pathIdent}, type: "${f.type}" }`)
									.join(",")}
							];
						`;
					}
				},
			},
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

export interface SocialLink {
	type: "discord" | "github" | "opencollective" | "custom";
	link: string;
	logo?: string;
	label?: string;
}
