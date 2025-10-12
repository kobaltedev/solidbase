import { vitePlugin as OGPlugin } from "@solid-mediakit/og/unplugin";
import { defineConfig } from "@solidjs/start/config";
import arraybuffer from "vite-plugin-arraybuffer";

import { createWithSolidBase, defineTheme } from "../src/config";
import { SidebarConfig, createFilesystemSidebar } from "../src/config/sidebar";
import defaultTheme, { DefaultThemeSidebarItem } from "../src/default-theme";

const theme = defineTheme({
	componentsPath: import.meta.resolve("./src/solidbase-theme"),
	extends: defaultTheme,
});

export default defineConfig(
	createWithSolidBase(theme)(
		{
			ssr: true,
			server: {
				esbuild: { options: { target: "es2022" } },
			},
			vite: {
				plugins: [OGPlugin(), arraybuffer()],
			},
		},
		{
			title: "SolidBase",
			description:
				"Fully featured, fully customisable static site generation for SolidStart",
			issueAutolink: "https://github.com/kobaltedev/solidbase/issues/:issue",
			lang: "en",
			markdown: {
				expressiveCode: {
					languageSwitcher: true,
				},
			},
			locales: {
				fr: {
					label: "Français",
					themeConfig: {
						nav: [
							{
								text: "Guide",
								link: "/guide",
							},
							{
								text: "Référence",
								link: "/reference",
							},
						],
						sidebar: {
							"/guide": [
								{
									title: "Aperçu",
									collapsed: false,
									items: [
										{
											title: "Qu'est-ce que SolidBase ?",
											link: "/",
										},
									],
								},
								{
									title: "Fonctionnalités",
									collapsed: false,
									items: [
										{
											title: "Extensions Markdown",
											link: "/markdown",
										},
									],
								},
							],
							"/reference": [
								{
									title: "Référence",
									collapsed: false,
									items: [],
								},
							],
						},
					},
				},
			},
			editPath: "https://github.com/kobaltedev/solidbase/edit/main/docs/:path",
			themeConfig: {
				socialLinks: {
					github: "https://github.com/kobaltedev/solidbase",
					discord: "https://discord.com/invite/solidjs",
				},
				nav: [
					{
						text: "Guide",
						link: "/guide",
					},
					{
						text: "Reference",
						link: "/reference",
					},
				],
				sidebar: {
					"/guide": customFSSidebar("/guide", "Overview"),
					"/reference": customFSSidebar("/reference", "Reference"),
				},
			},
		},
	),
);

function customFSSidebar(route: string, title: string) {
	const sidebar = createFilesystemSidebar(route);

	return [
		{
			title,
			items: sidebar.filter((i) => !("items" in i)),
		},
		...sidebar.filter((i) => "items" in i),
	];
}
