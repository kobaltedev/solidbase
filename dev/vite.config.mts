import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";

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
		Inspect(),
		solidBase.plugin({
			title: "SolidBase Dev",
			description: "Development playground for the latest SolidBase features",
			llms: true,
			lang: "en",
			routes: {
				path: "/{project}/{version}/{locale}",
				project: {
					default: "solidbase",
					values: {
						solidbase: { path: "", label: "SolidBase" },
						router: { path: "router", label: "Router Demo" },
					},
				},
				version: {
					default: "latest",
					values: {
						latest: { path: "", label: "Latest" },
						v1: { path: "v1", label: "v1", status: "Legacy" },
						v0: { href: "https://solidbase.dev", label: "External v0" },
					},
				},
				locale: {
					default: "en",
					values: {
						en: { path: "", label: "English", lang: "en-US" },
						fr: { path: "fr", label: "Français", lang: "fr-FR" },
						es: { path: "es", label: "Español", lang: "es-ES" },
					},
				},
				include: [
					{
						project: ["solidbase", "router"],
						version: "latest",
						locale: ["en", "fr"],
					},
					{
						project: "solidbase",
						version: "latest",
						locale: "es",
					},
					{
						project: "solidbase",
						version: "v1",
						locale: ["en", "fr"],
					},
				],
			},
			overrides: [
				{ project: "router", title: "Router Demo" },
				{ version: "v1", title: "SolidBase v1 Demo" },
				{ locale: "fr", titleTemplate: ":title - Demo SolidBase" },
				{
					project: "solidbase",
					version: "v1",
					locale: "fr",
					title: "SolidBase v1 en français",
				},
			],
			themeConfig: {
				sidebar: {
					"/": createFilesystemSidebar("./src/routes", {
						filter: (item) => {
							if ("items" in item) return true;
							return /\.(md|mdx)$/.test(item.filePath);
						},
					}),
				},
			},
		}),
		solidStart(solidBase.startConfig()),
		nitro({
			prerender: { crawlLinks: true },
		}),
	],
});
