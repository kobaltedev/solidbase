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
			search: {
				provider: "algolia",
				options: {
					appId: "H7ZQSI0SAN",
					apiKey: "c9354456dd4bb74c37e4d2b762b89b88",
					indexName: "kobalte",
				},
			},
			sidebar: {
				"/": {
					items: [
						{
							title: "Dev",
							collapsed: false,
							items: [
								{
									title: "Test",
									link: "/",
								},
							],
						},
						{
							title: "Other",
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
		},
	),
);
