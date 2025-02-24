import { vitePlugin as OGPlugin } from "@solid-mediakit/og/unplugin";
import { defineConfig } from "@solidjs/start/config";

import { createWithSolidBase, defineTheme } from "../src/config";
import defaultTheme from "../src/default-theme";

const theme = defineTheme({
	componentsPath: import.meta.resolve("./src/solidbase-theme"),
	extends: defaultTheme,
});

export default defineConfig(
	createWithSolidBase(theme)(
		{
			ssr: true,
			server: {
				prerender: {
					crawlLinks: true,
				},
			},
			vite: {
				plugins: [OGPlugin()],
			},
		},
		{
			title: "SolidBase",
			description:
				"Fully featured, fully customisable static site generation for SolidStart",
			titleTemplate: ":title – SolidBase",
			issueAutolink: "https://github.com/kobaltedev/solidbase/issues/:issue",
			lang: "en",
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
							"/guide": {
								items: [
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
							},
							"/reference": {
								items: [
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
			},
			editPath:
				"https://github.com/kobaltedev/solidbase/edit/main/docs/:path",
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
					"/guide": {
						items: [
							{
								title: "Overview",
								collapsed: false,
								items: [
									{
										title: "What is SolidBase?",
										link: "/",
									},
									{
										title: "Getting Started",
										link: "/getting-started",
									},
									{
										title: "Deploy",
										link: "/deploy",
									},
									{
										title: "Project Structure",
										link: "/structure",
									},
								],
							},
							{
								title: "Features",
								collapsed: false,
								items: [
									{
										title: "Markdown Extentions",
										link: "/markdown",
									},
									{
										title: "Internationalisation",
										link: "/i18n",
									},
									{
										title: "Sitemap Generation",
										link: "/sitemap",
									},
									{
										title: "Dev",
										link: "/dev",
									},
								],
							},
							{
								title: "Customisation",
								collapsed: false,
								items: [
									{
										title: "Custom Themes",
										link: "/custom-themes",
									},
									{
										title: "Extending Themes",
										link: "/extending-themes",
									},
								],
							},
						],
					},
					"/reference": {
						items: [
							{
								title: "Reference",
								collapsed: false,
								items: [
									{
										title: "Frontmatter Config",
										link: "/frontmatter",
									},
									{
										title: "Runtime API",
										link: "/runtime-api",
									},
								],
							},
							{
								title: "Default Theme",
								collapsed: false,
								items: [
									{
										title: "Overview",
										link: "/default-theme",
									},
									{
										title: "Sidebar",
										link: "/default-theme/sidebar",
									},
									{
										title: "Article",
										link: "/default-theme/article",
									},
									{
										title: "Footer",
										link: "/default-theme/footer",
									},
									{
										title: "Landing",
										link: "/default-theme/landing",
									},
								],
							},
						],
					},
				},
			},
		},
	),
);
