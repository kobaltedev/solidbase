import { defineConfig } from "@solidjs/start/config";
import { withSolidBase } from "../src/config";

export default defineConfig(
	withSolidBase(
		{
			ssr: true,
			server: {
				prerender: {
					crawlLinks: true,
				},
			},
		},
		{
			title: "SolidBase",
			description: "Solid Start Powered Static Site Generator",
			titleTemplate: ":title – SolidBase",
			editPath:
				"https://github.com/kobaltedev/solidbase/edit/main/docs/src/routes/:path",
			socialLinks: {
				github: "https://github.com/kobaltedev/solidbase",
				discord: "https://discord.com/invite/solidjs",
			},
			issueAutolink: "https://github.com/kobaltedev/solidbase/issues/:issue",
			lang: "en",
			locales: {
				fr: {
					label: "French",
					config: {
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
							"/": {
								items: [
									{
										title: "Aperçu",
										collapsed: false,
										items: [
											{
												title: "Introduction",
												link: "/",
											},
											{
												title: "Qu'est-ce que SolidBase ?",
												link: "/about",
											},
											{
												title: "Que nous manque-t-il ?",
												link: "/dave",
											},
										],
									},
									{
										title: "Fonctionnalités",
										collapsed: false,
										items: [
											{
												title: "MDX",
												link: "/about",
											},
											{
												title: "Copie de code",
												link: "/about",
											},
											{
												title: "Bons styles",
												link: "/about",
											},
											{
												title: "Équipe cool 8)",
												link: "/about",
											},
											{
												title: "CLI",
												link: "/about",
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
				"/": {
					items: [
						{
							title: "Overview",
							collapsed: false,
							items: [
								{
									title: "Introduction",
									link: "/",
								},
								{
									title: "What is SolidBase?",
									link: "/about",
								},
								{
									title: "What are we missing?",
									link: "/dave",
								},
							],
						},
						{
							title: "Features",
							collapsed: false,
							items: [
								{
									title: "MDX",
									link: "/about",
								},
								{
									title: "Code copy",
									link: "/about",
								},
								{
									title: "Good styles",
									link: "/about",
								},
								{
									title: "Cool team 8)",
									link: "/about",
								},
								{
									title: "CLI",
									link: "/about",
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
							items: [],
						},
					],
				},
			},
		},
	),
);
