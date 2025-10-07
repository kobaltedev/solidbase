import { vitePlugin as OGPlugin } from "@solid-mediakit/og/unplugin";
import { defineConfig } from "@solidjs/start/config";
import arraybuffer from "vite-plugin-arraybuffer";

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
					"/guide": [
						{
							title: "Overview",
							collapsed: false,
							items: [
								{
									title: "What is SolidBase?",
									link: "/",
								},
								{
									title: "Quick Start",
									link: "/quickstart",
									status: "new",
								},
								{
									title: "Add to an Existing Project",
									link: "/add-to-existing",
								},
								{
									title: "Configure Your App",
									link: "/config",
								},
								{
									title: "Project Structure",
									link: "/structure",
								},
								{
									title: "Deploy Your Site",
									link: "/deploy",
								},
							],
						},
						{
							title: "Features",
							collapsed: false,
							items: [
								{
									title: "Markdown Extensions",
									link: "/markdown",
								},
								{
									title: "Language Switcher",
									link: "/language-switcher",
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
					"/reference": [
						{
							title: "Reference",
							collapsed: false,
							items: [
								{
									title: "Configuration Options",
									link: "/config",
								},
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
									title: "CSS Variables",
									link: "/default-theme/css-variables",
								},
								{
									title: "Components",
									collapsed: false,
									items: [
										{
											title: "Article",
											link: "/default-theme/article",
										},
										{
											title: "Features",
											link: "/default-theme/features",
										},
										{
											title: "Footer",
											link: "/default-theme/footer",
										},
										{
											title: "Header",
											link: "/default-theme/header",
										},
										{
											title: "Hero",
											link: "/default-theme/hero",
										},
										{
											title: "Last Updated",
											link: "/default-theme/last-updated",
										},
										{
											title: "Link",
											link: "/default-theme/link",
										},
										{
											title: "Locale Selector",
											link: "/default-theme/locale-selector",
										},
										{
											title: "Sidebar",
											link: "/default-theme/sidebar",
										},
										{
											title: "Table of Contents",
											link: "/default-theme/toc",
										},
										{
											title: "Theme Selector",
											link: "/default-theme/theme-selector",
										},
									],
								},
								{
									title: "Landing",
									link: "/default-theme/landing",
								},
								{
									title: "Layout",
									link: "/default-theme/layout",
								},
							],
						},
					],
				},
			},
		},
	),
);
