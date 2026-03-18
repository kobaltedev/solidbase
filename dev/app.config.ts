import { createSolidBase, defineTheme } from "../src/config";
import defaultTheme from "../src/default-theme";

const theme = defineTheme({
	componentsPath: import.meta.resolve("./src/solidbase-theme"),
	extends: defaultTheme,
});

const solidBase = createSolidBase(theme);

export default {
	...solidBase.startConfig({
		ssr: true,
	}),
	server: {
		prerender: {
			crawlLinks: true,
		},
	},
	plugins: [
		solidBase.plugin({
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

						if (id.endsWith("to-transform.tsx")) {
							code += "// appended by transform";
						}

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
									status: "new",
								},
								{
									title: "About",
									link: "/about",
									status: "updated",
								},
								{
									title: "Expressive Code",
									link: "/ec",
									status: "next",
								},
								{
									title: "EC File",
									link: "/ec-file",
									status: {
										text: "Custom",
										color: "purple",
									},
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
		}),
	],
};
