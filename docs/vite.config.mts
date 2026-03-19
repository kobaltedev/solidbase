import { vitePlugin as OGPlugin } from "@solid-mediakit/og/unplugin";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import arraybuffer from "vite-plugin-arraybuffer";

import { createSolidBase, defineTheme } from "../src/config";
import { createFilesystemSidebar } from "../src/config/sidebar";
import defaultTheme from "../src/default-theme";

const theme = defineTheme({
	componentsPath: import.meta.resolve("./src/solidbase-theme"),
	extends: defaultTheme,
});

const solidBase = createSolidBase(theme);

export default defineConfig({
	plugins: [
		OGPlugin(),
		arraybuffer(),
		solidBase.plugin({
			title: "SolidBase",
			description:
				"Fully featured, fully customisable static site generation for SolidStart",
			llms: true,
			sitemap: {
				hostname: "https://solidbase.dev",
			},
			robots: true,
			issueAutolink: "https://github.com/kobaltedev/solidbase/issues/:issue",
			lang: "en",
			markdown: {
				expressiveCode: {
					languageSwitcher: false,
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
					"/guide": createFilesystemSidebar("./src/routes/guide"),
					"/reference": createFilesystemSidebar("./src/routes/reference"),
				},
			},
		}),
		solidStart(solidBase.startConfig()),
		nitro({
			preset: "netlify",
			prerender: { crawlLinks: true },
		}),
	],
});
