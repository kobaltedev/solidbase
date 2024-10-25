import { Dialog } from "@kobalte/core/dialog";
import { Title } from "@solidjs/meta";
import { A, RouteSectionProps } from "@solidjs/router";
import { For, Show } from "solid-js";

import { ThemeContextProvider, useThemeContext } from "../context";
import { mobileLayout } from "../globals";
import { useSidebar } from "../sidebar";
import Link from "./Link";
import { useCurrentPageData } from "../../client/page-data";
import { Sidebar } from "../config";
import { useRouteConfig, useSolidBaseContext } from "../utils";

import "../index.css";
import styles from "./index.module.css";
// font css is imported by theme vite plugin

export default (props: RouteSectionProps) => (
  <ThemeContextProvider>
    <Layout {...props} />
  </ThemeContextProvider>
);

function Layout(props: RouteSectionProps) {
  const {
    sidebarOpen,
    setSidebarOpen,
    components: { Header, Article },
  } = useThemeContext();
  const config = useRouteConfig();

  const sidebar = useSidebar();
  const pageData = useCurrentPageData();

  return (
    <>
      <div class={styles.skipnav}>
        <Link
          href="#main-content"
          onClick={() => {
            (
              document
                .getElementById("main-content")
                ?.querySelector(
                  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
                ) as HTMLElement | undefined
            )?.focus();
          }}
        >
          Skip to main content
        </Link>
      </div>

      <Show
        when={pageData().frontmatter?.title}
        fallback={<Title>{config().title}</Title>}
      >
        <Title>
          {(config().titleTemplate ?? ":title").replace(
            ":title",
            pageData().frontmatter?.title,
          )}
        </Title>
      </Show>

      <div class={styles.layout}>
        <Header />

        <Show
          when={sidebar() && sidebar()!.items?.length > 0}
          fallback={<div />}
        >
          <Show
            when={mobileLayout()}
            fallback={
              <aside class={styles.sidenav}>
                <div class={styles["sidenav-content"]}>
                  <Navigation sidebar={sidebar()!} />
                </div>
              </aside>
            }
          >
            <Dialog open={sidebarOpen()} onOpenChange={setSidebarOpen}>
              <Dialog.Portal>
                <Dialog.Overlay class={styles["sidenav-overlay"]} />
                <Dialog.Content class={styles.sidenav}>
                  <div class={styles["sidenav-content"]}>
                    <div class={styles["sidenav-header"]}>
                      <a href="/" class={styles["logo-link"]}>
                        <Show
                          when={config().logo}
                          fallback={<span>{config().title}</span>}
                        >
                          <img src={config().logo} alt={config().title} />
                        </Show>
                      </a>
                    </div>
                    <Navigation sidebar={sidebar()!} />
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </Show>
        </Show>

        <main id="main-content">
          <Article>{props.children}</Article>
        </main>
      </div>
    </>
  );
}

interface NavigationProps {
  sidebar: Sidebar;
}
const Navigation = (props: NavigationProps) => {
  const { locale } = useSolidBaseContext();

  return (
    <nav class={styles["sidenav-links"]}>
      <ul>
        <For each={props.sidebar.items}>
          {(section) => (
            <li>
              <h2>{section.title}</h2>
              <ul>
                <For each={section.items}>
                  {(item) => (
                    <li>
                      <A
                        class={`${styles["sidenav-link"]}`}
                        activeClass={styles.active}
                        href={locale.applyPathPrefix(
                          (item as { link: string }).link,
                        )}
                        end
                      >
                        {item.title}
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
};
