import { Title } from "@solidjs/meta";

import { For, type ParentProps, Show, createSignal } from "solid-js";
import { useSolidBaseContext } from "../context";
import { CurrentPageDataContext, useCurrentPageData } from "../page-data";
import styles from "./Layout.module.css";
import Link from "./Link";

import { solidBaseConfig } from "virtual:solidbase";
import { Dialog } from "@kobalte/core/dialog";
import { isMobile } from "@solid-primitives/platform";
import { A } from "@solidjs/router";
import { CrossIcon } from "./icons";
import { Sidebar } from "../../config";
import { useSidebar } from "../sidebar";

interface SidebarItem {
  title: string;
  collapsed: boolean;
  items: ({ title: string; link: string } | SidebarItem)[];
}

export default function Layout(props: ParentProps) {
  const { Header, Article } = useSolidBaseContext().components;

  const pageData = useCurrentPageData();

  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const sidebar = useSidebar();

  return (
    <CurrentPageDataContext.Provider value={pageData}>
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
        fallback={<Title>{solidBaseConfig.title}</Title>}
      >
        <Title>
          {(solidBaseConfig.titleTemplate ?? ":title").replace(
            ":title",
            pageData().frontmatter?.title,
          )}
        </Title>
      </Show>

      <div class={styles.layout}>
        <Header setSidebarOpen={setSidebarOpen} />

        <Show when={sidebar()}>
          {(sidebar) => (
            <>
              <Show when={isMobile}>
                <Dialog open={sidebarOpen()} onOpenChange={setSidebarOpen}>
                  <Dialog.Portal>
                    <Dialog.Overlay class={styles["sidenav-overlay"]} />
                    <Dialog.Content class={styles.sidenav}>
                      <div class={styles["sidenav-content"]}>
                        <div class={styles["sidenav-header"]}>
                          <a href="/" class={styles["logo-link"]}>
                            <Show
                              when={solidBaseConfig.logo}
                              fallback={<span>{solidBaseConfig.title}</span>}
                            >
                              <img
                                src={solidBaseConfig.logo}
                                alt={solidBaseConfig.title}
                              />
                            </Show>
                          </a>
                          <Dialog.CloseButton
                            class={styles["sidenav-close-btn"]}
                          >
                            <CrossIcon />
                          </Dialog.CloseButton>
                        </div>
                        <Navigation sidebar={sidebar()} />
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog>
              </Show>
              <aside class={styles.sidenav}>
                <Navigation sidebar={sidebar()} />
              </aside>
            </>
          )}
        </Show>

        <main id="main-content">
          <Article>{props.children}</Article>
        </main>
      </div>
    </CurrentPageDataContext.Provider>
  );
}

interface NavigationProps {
  sidebar: Sidebar;
}
const Navigation = (props: NavigationProps) => {
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
                        href={(item as { link: string }).link}
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
