declare module "virtual:solidbase" {
  export const solidBaseConfig: import("./config").SolidBaseResolvedConfig<any>;
  export const Layout: import("solid-js").Component<
    import("@solidjs/router").RouteSectionProps
  >;
  export const mdxComponents: Record<string, import("solid-js").Component<any>>;
}
