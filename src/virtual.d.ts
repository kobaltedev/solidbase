declare module "virtual:solidbase" {
  export const solidBaseConfig: import("./config").SolidBaseResolvedConfig<any>;
  export const Root: import("solid-js").Component<
    import("@solidjs/router").RouteSectionProps
  >;
  export const mdxComponents: Record<string, import("solid-js").Component<any>>;
  export const overrideMdxComponents: Record<
    string,
    import("solid-js").Component<any>
  >;
}
