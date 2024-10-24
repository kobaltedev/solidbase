// @ts-ignore
import { overrideMdxComponents, solidBaseComponents } from "virtual:solidbase";
import { MetaProvider } from "@solidjs/meta";
import {
  type Accessor,
  type ParentProps,
  type Setter,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import { MDXProvider } from "solid-mdx";
import type { SolidBaseResolvedConfig } from "../config";
import Article from "../default-theme/components/Article";
import Footer from "../default-theme/components/Footer";
import Header from "../default-theme/components/Header";
import LastUpdated from "../default-theme/components/LastUpdated";
import Layout from "../default-theme/components/Layout";
import Link from "../default-theme/components/Link";
import LocaleSelector from "../default-theme/components/LocaleSelector";
import TableOfContents from "../default-theme/components/TableOfContents";
import ThemeSelector from "../default-theme/components/ThemeSelector";
import * as mdxComponents from "../default-theme/components/mdx-components";
import { useRouteConfig } from "./config";
import { useLocale } from "./locale";

export interface SolidBaseContextValue<ThemeConfig> {
  components: {
    Header: typeof Header;
    TableOfContents: typeof TableOfContents;
    Layout: typeof Layout;
    Article: typeof Article;
    Link: typeof Link;
    LastUpdated: typeof LastUpdated;
    Footer: typeof Footer;
    ThemeSelector: typeof ThemeSelector;
    LocaleSelector: typeof LocaleSelector;
  };
  config: Accessor<SolidBaseResolvedConfig<ThemeConfig>>;
  locale: ReturnType<typeof useLocale>;
  sidebarOpen: Accessor<boolean>;
  setSidebarOpen: Setter<boolean>;
  tocOpen: Accessor<boolean>;
  setTocOpen: Setter<boolean>;
}

const SolidBaseContext = createContext<SolidBaseContextValue<any>>();

export function useSolidBaseContext<ThemeConfig>() {
  const context = useContext(SolidBaseContext);

  if (context === undefined) {
    if (import.meta.env.VITE_SOLIDBASE_DEV) location.reload();
    throw new Error(
      "[SolidBase]: `useSolidBaseContext` must be used within a `SolidBase` component",
    );
  }

  return context as SolidBaseContextValue<ThemeConfig>;
}

function renameCustomMdxComponents(components: Record<string, any>) {
  for (const name of Object.keys(components)) {
    if (name[0].toUpperCase() === name[0]) {
      components[`$$solidbase_${name.toLowerCase()}`] = components[name];
      components[name] = undefined;
    }
  }
  return components;
}

export function SolidBaseProvider(props: ParentProps) {
  const locale = useLocale();
  const config = useRouteConfig();

  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [tocOpen, setTocOpen] = createSignal(false);

  return (
    <MetaProvider>
      <MDXProvider
        components={renameCustomMdxComponents({
          ...mdxComponents,
          ...(overrideMdxComponents ?? {}),
        })}
      >
        <SolidBaseContext.Provider
          value={{
            components: {
              Header,
              TableOfContents,
              Layout,
              Article,
              Link,
              LastUpdated,
              Footer,
              ThemeSelector,
              LocaleSelector,
              ...solidBaseComponents,
            },
            locale,
            config,
            sidebarOpen,
            setSidebarOpen,
            tocOpen,
            setTocOpen,
          }}
        >
          {props.children}
        </SolidBaseContext.Provider>
      </MDXProvider>
    </MetaProvider>
  );
}
