import { FileRoutes } from "@solidjs/start/router";
import {
  type Component,
  type ComponentProps,
  For,
  type JSX,
  type ParentComponent,
  type ParentProps,
  Show,
  Suspense,
  children,
  createContext,
  useContext,
} from "solid-js";
import { MDXProvider } from "solid-mdx";

// @ts-ignore
import { overrideMdxComponents, solidBaseComponents } from "virtual:solidbase";

import Header from "./components/Header";
import * as mdxComponents from "./components/mdx-components";

interface SolidBaseContextValue {
  components: {
    Header: ParentComponent<{}>;
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

export function SolidBaseProvider(props: ParentProps) {
  return (
    <MetaProvider>
      <MDXProvider
        components={{
          ...mdxComponents,
          ...overrideMdxComponents,
        }}
      >
        <SolidBaseContext.Provider
          value={{
            components: {
              Header,
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

import { MetaProvider, Title } from "@solidjs/meta";
import { type BaseRouterProps, Router } from "@solidjs/router";
import { Dynamic } from "solid-js/web";

import { useCurrentFrontmatter } from "./frontmatter";
import { createTableOfContents } from "./toc";

export function SolidBaseLayout(props: ParentProps) {
  const { Header } = useSolidBaseContext().components;

  const frontmatter = useCurrentFrontmatter();
  const toc = createTableOfContents(() => [2, 6]);

  return (
    <div
      style={{
        "min-height": "100vh",
        display: "flex",
        "flex-direction": "column",
      }}
    >
      <Title>{frontmatter()?.title ?? ""}</Title>

      <Header>inside header</Header>
      <div
        style={{
          "flex-direction": "row",
          display: "flex",
          gap: "2rem",
          flex: 1,
        }}
      >
        <aside
          style={{
            "min-width": "12rem",
            flex: "1",
            display: "flex",
            "flex-direction": "row",
            padding: "1rem",
            "border-right": "1px solid gray",
          }}
        >
          <div style={{ flex: "1" }} />
          <div style={{ "margin-left": "auto", height: "100%" }}>Sidebar</div>
        </aside>

        <article
          id="solidbase-doc"
          style={{ "max-width": "52rem", width: "100%" }}
        >
          {props.children}
        </article>

        <aside
          style={{ "min-width": "12rem", flex: "1", "padding-top": "2rem" }}
        >
          <Show when={toc().length > 0}>
            <nav
              style={{
                "border-left": "1px solid gray",
                "padding-left": "1rem",
              }}
            >
              <span style={{ "line-height": "2rem" }}>On This Page</span>
              <ul
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  padding: 0,
                }}
              >
                <For each={toc()}>
                  {(item) => (
                    <li style={{ "list-style": "none" }}>
                      <a
                        href={`#${item.slug}`}
                        style={{
                          "margin-left": `${(item.depth - 2) * 2}rem`,
                          "line-height": "1.75rem",
                          display: "block",
                        }}
                      >
                        {item.text}
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
          </Show>
        </aside>
      </div>
    </div>
  );
}

type RootProps = ComponentProps<NonNullable<BaseRouterProps["root"]>>;
interface AppRootProps extends RootProps {
  layout?: LayoutComponent;
}
function AppRoot(props: AppRootProps) {
  const frontmatter = useCurrentFrontmatter();
  const resolved = children(() => props.children);
  return (
    <Show
      when={!props.layout}
      fallback={
        <Dynamic
          component={props.layout}
          frontmatter={frontmatter()}
          children={resolved()}
        />
      }
    >
      <SolidBaseLayout>
        <Suspense>{resolved()}</Suspense>
      </SolidBaseLayout>
    </Show>
  );
}

interface LayoutOptions {
  frontmatter?: Record<string, string>;
  children?: JSX.Element;
}

type LayoutComponent = Component<LayoutOptions>;

interface SolidBaseAppProps {
  root?: BaseRouterProps["root"];
  layout?: LayoutComponent;
  children?: BaseRouterProps["children"];
}

export function SolidBaseApp(props: SolidBaseAppProps) {
  const resolved = children(() => {
    return props.children as unknown as JSX.Element;
  });

  return (
    <SolidBaseProvider>
      <Router
        root={(rootProps) => (
          <Show
            when={props.root}
            fallback={
              <Suspense>
                <AppRoot
                  data={rootProps.data}
                  location={rootProps.location}
                  params={rootProps.params}
                  children={rootProps.children}
                  layout={props.layout}
                />
              </Suspense>
            }
          >
            {props.root?.(rootProps)}
          </Show>
        )}
      >
        <Show when={resolved()} fallback={<FileRoutes />}>
          {resolved()}
        </Show>
      </Router>
    </SolidBaseProvider>
  );
}
