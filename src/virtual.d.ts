declare module "virtual:solidbase/config" {
	export const solidBaseConfig: import("./config").SolidBaseResolvedConfig<any>;
}

declare module "virtual:solidbase/components" {
	export const Layout: import("solid-js").Component<
		import("@solidjs/router").RouteSectionProps
	>;
	export const mdxComponents: Record<string, import("solid-js").Component<any>>;
}

declare module "virtual:solidbase/default-theme/fonts" {
	export const preloadFonts: Array<{ path: string; type: string }>;
}
