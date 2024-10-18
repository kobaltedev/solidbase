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
			locales: {
				root: {
					label: "English",
					lang: "en",
				},
				fr: {
					label: "French",
				},
			},
			sidebar: {
				items: [
					{
						title: "Overview",
						collapsed: false,
						items: [
							{
								title: "Introducation",
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
		},
	),
);
