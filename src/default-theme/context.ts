// @ts-ignore
import { solidBaseComponents } from "virtual:solidbase";
import { createContextProvider } from "@solid-primitives/context";
import { createSignal } from "solid-js";

import Article from "./components/Article";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LastUpdated from "./components/LastUpdated";
import Layout from "./components/Layout";
import Link from "./components/Link";
import LocaleSelector from "./components/LocaleSelector";
import TableOfContents from "./components/TableOfContents";
import ThemeSelector from "./components/ThemeSelector";

export const [ThemeContextProvider, useThemeContext] = createContextProvider(
  () => {
    const [sidebarOpen, setSidebarOpen] = createSignal(false);
    const [tocOpen, setTocOpen] = createSignal(false);

    return {
      sidebarOpen,
      setSidebarOpen,
      tocOpen,
      setTocOpen,
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
    };
  },
  null!,
);
