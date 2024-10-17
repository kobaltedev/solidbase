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
		},
	),
);
