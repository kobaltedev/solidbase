import { defineConfig } from "@solidjs/start/config";

import { createWithSolidBase, defineTheme } from "../src/config";
import defaultTheme from "../src/default-theme";

const customTheme = defineTheme({
	componentsPath: import.meta.resolve("./src/solidbase-theme"),
	extends: defaultTheme,
});

export default defineConfig(
	createWithSolidBase(customTheme)(
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
			description:
				"Fully featured, fully customisable static site generation for SolidStart",
			titleTemplate: ":title – SolidBase",
			issueAutolink: "https://github.com/kobaltedev/solidbase/issues/:issue",
			editPath: "https://github.com/kobaltedev/solidbase/edit/main/docs/:path",
			markdown: {
				importCodeFile: {
					transform: (_code, id) => {
						let code = _code;

						// tests id
						if (id.endsWith("to-transform.tsx")) {
							code += "// appended by transform";
						}

						// tests code
						return code.replace("REPLACE ME", "replaced string!");
					},
				},
			},
			themeConfig: {
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
					"/": [
						{
							title: "Dev",
							items: [
								{
									title: "Index",
									link: "/",
								},
								{
									title: "About",
									link: "/about",
								},
								{
									title: "Expressive Code",
									link: "/ec",
								},
								{
									title: "EC File",
									link: "/ec-file",
								},
								{
									title: "Package Manager",
									link: "/pm",
								},
								{
									title: "Frontmatter",
									link: "/frontmatter",
								},
							],
						},
						{
							title: "Other",
							items: [
								{
									title: "Nested",
									items: [
										{
											title: "What are we missing?",
											link: "/dave",
										},
									],
								},
							],
						},
					],
				},
			},
		},
	),
);
