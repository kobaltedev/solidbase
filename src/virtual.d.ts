declare module "virtual:solidbase/config" {
	export const solidBaseConfig: import("./config/index.js").SolidBaseResolvedConfig<any>;
}

declare module "virtual:solidbase/components" {
	export const Layout: import("solid-js").Component<
		import("solid-js").ParentProps
	>;
	export const mdxComponents: Record<string, import("solid-js").Component<any>>;
}

declare module "virtual:solidbase/default-theme/fonts" {
	export const preloadFonts: Array<{ path: string; type: string }>;
}
