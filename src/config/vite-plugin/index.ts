import { fileURLToPath } from "node:url";
import MagicString from "magic-string";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import type { PluginOption } from "vite";

import type { SolidBaseResolvedConfig, ThemeDefinition } from "../index.js";
import solidBaseLlmsPlugin from "./llms.js";
import solidBaseSitemapPlugin from "./sitemap.js";
import {
	componentsModule,
	configModule,
	transformMdxModule,
} from "./virtual.js";

export default function solidBaseVitePlugin(
	theme: ThemeDefinition<any>,
	solidBaseConfig: SolidBaseResolvedConfig<any>,
): PluginOption {
	let root = process.cwd();

	const plugins: PluginOption[] = [
		{
			name: "solidbase:pre",
			enforce: "pre",
			config() {
				return { resolve: { noExternal: ["@kobalte/solidbase"] } };
			},
			configResolved(resolvedConfig) {
				root = resolvedConfig.root;
			},
			resolveId(id) {
				if (id === configModule.id) return configModule.resolvedId;
				if (id === componentsModule.id) return componentsModule.resolvedId;
				if (id === "virtual:solidbase/mdx") return "\0virtual:solidbase/mdx";
				if (id.startsWith("\0unfonts.css")) return id.slice("\0".length);
			},
			async load(id) {
				if (id === configModule.resolvedId)
					return configModule.load(solidBaseConfig, root);
				if (id === componentsModule.resolvedId)
					return await componentsModule.load(theme);
				if (id === "\0virtual:solidbase/mdx")
					return `export * from "@kobalte/solidbase/mdx"`;
			},
			transform(code, id) {
				if (isMarkdown(id)) {
					const s = new MagicString(code);
					s.replaceAll(
						/="(\$\$SolidBase_RelativeImport\d+)"/gm,
						(_, ident) => `={${ident}}`,
					);

					return {
						code: s.toString(),
						map: s.generateMap(),
					};
				}
			},
		},
		{
			name: "solidbase:post",
			enforce: "post",
			transform(code, id) {
				if (isMarkdown(id))
					return transformMdxModule(code, id, solidBaseConfig);
			},
		},
	];

	if (solidBaseConfig.autoImport) {
		const {
			resolvers: _resolvers,
			iconResolver,
			...autoImport
		} = solidBaseConfig.autoImport === true ? {} : solidBaseConfig.autoImport;

		const resolvers: Resolver[] = [];

		if (_resolvers) {
			if (Array.isArray(_resolvers)) resolvers.push(..._resolvers.flat());
			else resolvers.push(_resolvers);
		}

		if (iconResolver !== false)
			resolvers.push(
				IconsResolver({
					prefix: "Icon",
					...iconResolver,
					extension: "jsx",
				}),
			);

		plugins.push(
			VinxiAutoImport({
				dts: fileURLToPath(new URL("./src/auto-imports.d.ts", import.meta.url)),
				...autoImport,
				resolvers,
			}),
		);
	}

	if (solidBaseConfig.icons !== false)
		plugins.push(
			Icons({
				compiler: "solid",
				autoInstall: true,
				...solidBaseConfig.icons,
			}),
		);

	plugins.push(solidBaseLlmsPlugin(solidBaseConfig));
	plugins.push(solidBaseSitemapPlugin(solidBaseConfig));

	return plugins;
}

export function isMarkdown(path: string) {
	return !!path.match(/\.(mdx|md)/gm);
}

import type { Options, Resolver } from "unplugin-auto-import/dist/types.js";
// Workaround for https://github.com/solidjs/solid-start/issues/1374
import type { Plugin } from "vite";

function VinxiAutoImport(options: Options): PluginOption {
	const autoimport = AutoImport(options) as Plugin;
	const transform =
		typeof autoimport.transform === "function"
			? autoimport.transform
			: autoimport.transform?.handler;

	const ABSOLUTE_PATH = /^\/|^[a-zA-Z]:\//;

	return {
		...autoimport,
		transform(src, id) {
			let pathname = id;

			if (ABSOLUTE_PATH.test(id)) {
				pathname = new URL(`file://${id}`).pathname;
			}

			return transform?.call(this, src, pathname);
		},
	};
}
