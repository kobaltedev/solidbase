import { ThemeDefinition } from "../config";

export type DefaultThemeConfig = {
  editPath?: string | ((path: string) => string);
  lastUpdated?: Intl.DateTimeFormatOptions | false;
  footer?: boolean;
  socialLinks?:
    | Record<Exclude<SocialLink["type"], "custom">, string>
    | Record<string, Omit<SocialLink, "type">>;
  nav?: Array<NavItem>;
  sidebar?: Sidebar | Record<`/${string}`, Sidebar>;
  search?: SearchConfig;
};

type ResolvedThemeKeys = "nav" | "sidebar" | "lastUpdated" | "footer";
type ResolvedThemeConfig = Omit<DefaultThemeConfig, ResolvedThemeKeys> &
  Required<Pick<DefaultThemeConfig, ResolvedThemeKeys>>;

const defaultTheme: ThemeDefinition<DefaultThemeConfig, ResolvedThemeConfig> = {
  path: import.meta.resolve("@kobalte/solidbase/default-theme"),
  resolveConfig: (config: DefaultThemeConfig): ResolvedThemeConfig => ({
    nav: [],
    sidebar: { items: [] },
    lastUpdated: { dateStyle: "short", timeStyle: "short" },
    footer: true,
    ...config,
  }),
};
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
