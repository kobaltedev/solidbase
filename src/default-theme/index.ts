import { defineTheme, ThemeDefinition } from "../config";
import { fileURLToPath } from "node:url";

export type DefaultThemeConfig = {
  footer?: boolean;
  socialLinks?:
    | Record<Exclude<SocialLink["type"], "custom">, string>
    | Record<string, Omit<SocialLink, "type">>;
  nav?: Array<NavItem>;
  sidebar?: Sidebar | Record<`/${string}`, Sidebar>;
  search?: SearchConfig;
  fonts?: boolean;
};

type ResolvedThemeKeys = "nav" | "sidebar" | "footer" | "fonts";
type ResolvedThemeConfig = Omit<DefaultThemeConfig, ResolvedThemeKeys> &
  Required<Pick<DefaultThemeConfig, ResolvedThemeKeys>>;

const defaultTheme: ThemeDefinition<DefaultThemeConfig, ResolvedThemeConfig> =
  defineTheme({
    path: import.meta.resolve("@kobalte/solidbase/default-theme"),
    resolveConfig: (config: DefaultThemeConfig): ResolvedThemeConfig => ({
      nav: [],
      sidebar: { items: [] },
      footer: true,
      fonts: true,
      ...config,
    }),
    vite(config) {
      const rootPath = fileURLToPath(
        import.meta.resolve(
          "@kobalte/solidbase/default-theme/components/index.tsx",
        ),
      );

      return {
        config() {
          return {
            define: {
              "import.meta.env.SOLIDBASE_DEFAULT_THEME_FONTS": config.fonts,
            },
          };
        },
        transform(code, path) {
          if (path === rootPath && config.fonts) {
            return `import "../fonts/index.css";\n${code}`;
          }
        },
      };
    },
  });
export default defaultTheme;

export type SearchConfig = {
  provider: "algolia";
  options: DocSearchOptions;
};
export interface DocSearchOptions {
  appId: string;
  apiKey: string;
  indexName: string;
}

export type NavItem = {
  text: string;
  link: string;
  activeMatch?: string;
};

export interface SidebarLink {
  title: string;
  link: string;
}

export interface SidebarItem {
  title: string;
  collapsed: boolean;
  items: (SidebarItem | SidebarLink)[];
}

export interface SocialLink {
  type: "discord" | "github" | "opencollective" | "custom";
  link: string;
  logo?: string;
  label?: string;
}

export type Sidebar = {
  headerTitle?: string;
  items: SidebarItem[];
};
