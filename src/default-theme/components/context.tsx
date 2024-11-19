import { createContextProvider } from "@solid-primitives/context";
import {
  type ParentProps,
  createContext,
  createSignal,
  useContext,
} from "solid-js";

import Article from "./Article";
import Features from "./Features";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import LastUpdated from "./LastUpdated";
import Link from "./Link";
import LocaleSelector from "./LocaleSelector";
import TableOfContents from "./TableOfContents";
import ThemeSelector from "./ThemeSelector";

const defaultComponents = {
  Article,
  Footer,
  Header,
  LastUpdated,
  Link,
  LocaleSelector,
  TableOfContents,
  ThemeSelector,
  Hero,
  Features,
};

export type ThemeComponents = typeof defaultComponents;

const ComponentsContext = createContext<ThemeComponents>(defaultComponents);

export function ComponentsProvider(
  props: ParentProps & { components?: Partial<ThemeComponents> },
) {
  return (
    <ComponentsContext.Provider
      value={{ ...defaultComponents, ...props.components }}
    >
      {props.children}
    </ComponentsContext.Provider>
  );
}

export const useThemeComponents = () => useContext(ComponentsContext);

export const [DefaultThemeContextProvider, useDefaultThemeContext] =
  createContextProvider(() => {
    const [sidebarOpen, setSidebarOpen] = createSignal(false);
    const [tocOpen, setTocOpen] = createSignal(false);

    return { sidebarOpen, setSidebarOpen, tocOpen, setTocOpen };
  }, null!);
