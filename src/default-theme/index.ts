import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { defineTheme, type ThemeDefinition } from "../config/index.js";
import type { SidebarConfig, SidebarItem } from "../config/sidebar.js";
import type { Component, JSX } from "solid-js";
import type { DefaultThemeTextConfig } from "./text.js";

export type { DefaultThemeTextConfig } from "./text.js";
export { defaultThemeTextConfig } from "./text.js";

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

export type DefaultThemeActionIconComponent = Component<{
	class?: string;
}> | Component<JSX.SvgSVGAttributes<SVGSVGElement>>;

export interface DefaultThemeSvgActionIcon {
	svg: string;
}

export interface DefaultThemeComponentActionIcon {
	component: DefaultThemeActionIconComponent;
}

export type DefaultThemeActionIconConfig =
	| DefaultThemeSvgActionIcon
	| DefaultThemeComponentActionIcon;

export type DefaultThemeActionIcon =
	| string
	| DefaultThemeActionIconComponent
	| DefaultThemeActionIconConfig;

export interface DefaultThemeActionsConfig {
	icons?: Record<string, DefaultThemeActionIcon>;
}

export type DefaultThemeConfig = {
	footer?: boolean;
	socialLinks?: {
		[K in Exclude<SocialLink["type"], "custom"> | (string & {})]?:
			| string
			| Omit<SocialLink, "type">;
	};
	actions?: DefaultThemeActionsConfig;
	nav?: Array<NavItem>;
	sidebar?: SidebarConfig<DefaultThemeSidebarItem>;
	search?: SearchConfig;
	fonts?: { [K in keyof typeof allFonts]?: false } | false;
	text?: Partial<DefaultThemeTextConfig>;
};

type Font = { cssPath: string; preloadFontPath: string; fontType: string };

const require = createRequire(import.meta.url);

function resolvePackageFile(specifier: string) {
	return pathToFileURL(require.resolve(specifier)).href;
}

const allFonts = {
	inter: {
		cssPath: resolvePackageFile("@fontsource-variable/inter"),
		preloadFontPath: resolvePackageFile(
			"@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
		),
		fontType: "woff2",
	},
	lexend: {
		cssPath: resolvePackageFile("@fontsource-variable/lexend"),
		preloadFontPath: resolvePackageFile(
			"@fontsource-variable/lexend/files/lexend-latin-wght-normal.woff2",
		),
		fontType: "woff2",
	},
	jetbrainsMono: {
		cssPath: resolvePackageFile("@fontsource-variable/jetbrains-mono"),
		preloadFontPath: resolvePackageFile(
			"@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
		),
		fontType: "woff2",
	},
} satisfies Record<string, Font>;

const defaultTheme: ThemeDefinition<DefaultThemeConfig> = defineTheme({
	componentsPath: new URL("./", import.meta.url).href,
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
						return "\0virtual:solidbase/default-theme/fonts.css";
					if (id.startsWith("virtual:solidbase/default-theme/fonts"))
						return "\0virtual:solidbase/default-theme/fonts";
				},
				load(id) {
					if (id.startsWith("\0virtual:solidbase/default-theme/fonts.css"))
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

export type SearchConfig = {};

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
