// @ts-ignore
import { overrideMdxComponents, solidBaseComponents } from "virtual:solidbase";
import { MetaProvider } from "@solidjs/meta";
import { type ParentProps, createContext, useContext } from "solid-js";
import { MDXProvider } from "solid-mdx";
import Header from "./components/Header";
import Layout from "./components/Layout";
import TableOfContent from "./components/TableOfContent";
import * as mdxComponents from "./components/mdx-components";

export interface SolidBaseContextValue {
  components: {
    Header: typeof Header;
    TableOfContent: typeof TableOfContent;
    Layout: typeof Layout;
  };
}

const SolidBaseContext = createContext<SolidBaseContextValue>();

export function useSolidBaseContext() {
  const context = useContext(SolidBaseContext);

  if (context === undefined) {
    throw new Error(
      "[SolidBase]: `useSolidBaseContext` must be used within a `SolidBase` component",
    );
  }

  return context;
}

function renameCustomMdxComponents(components: Record<string, any>) {
  for (const name of Object.keys(components)) {
    if (name[0].toUpperCase() === name[0]) {
      components[`$$${name}`] = components[name];
      components[name] = undefined;
    }
  }
  return components;
}

export function SolidBaseProvider(props: ParentProps) {
  return (
    <MetaProvider>
      <MDXProvider
        components={renameCustomMdxComponents({
          ...mdxComponents,
          ...overrideMdxComponents,
        })}
      >
        <SolidBaseContext.Provider
          value={{
            components: {
              Header,
              TableOfContent,
              Layout,
              ...solidBaseComponents,
            },
          }}
        >
          {props.children}
        </SolidBaseContext.Provider>
      </MDXProvider>
    </MetaProvider>
  );
}
