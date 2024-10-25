import { useMatch } from "@solidjs/router";
import { For, Show, createSignal, lazy } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";

import { useRouteConfig, useSolidBaseContext } from "../utils";
import styles from "./Header.module.css";
import { ArrowDownIcon, MenuLeftIcon } from "./icons";
import { getLocaleLink } from "../../client/locale";
import { DefaultThemeConfig } from "../config";
import { useThemeContext } from "../context";

const DocSearch = lazy(() => import("./DocSearch"));

const BUFFER_MULT = 3;

export default function Header() {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [tocRef, setTocRef] = createSignal<HTMLElement>();

  const {
    tocOpen,
    setTocOpen,
    setSidebarOpen,
    components: { ThemeSelector, LocaleSelector, TableOfContents },
  } = useThemeContext();

  const config = useRouteConfig();
  const { locale } = useSolidBaseContext();

  return (
    <Dialog open={tocOpen()} onOpenChange={setTocOpen} modal={false}>
      <header class={styles.header} ref={setRef}>
        <div>
          <a
            href={getLocaleLink(locale.currentLocale())}
            class={styles["logo-link"]}
          >
            <Show when={config().logo} fallback={<span>{config().title}</span>}>
              <img src={config().logo} alt={config().title} />
            </Show>
          </a>
          <div class={styles.selectors}>
            {config().themeConfig?.search?.provider === "algolia" && (
              <DocSearch />
            )}
            <Show when={config().themeConfig?.nav}>
              {(nav) => (
                <For each={nav()}>
                  {(item) => {
                    const match = useMatch(() =>
                      locale.applyPathPrefix(
                        `${item.activeMatch ?? item.link}/*rest`,
                      ),
                    );

                    return (
                      <a
                        class={styles.navLink}
                        href={locale.applyPathPrefix(item.link)}
                        data-matched={match() !== undefined ? true : undefined}
                      >
                        {item.text}
                      </a>
                    );
                  }}
                </For>
              )}
            </Show>
            <LocaleSelector<DefaultThemeConfig> />
            <ThemeSelector />
          </div>
        </div>
        <div class={styles["mobile-bar"]}>
          <button
            type="button"
            class={styles["mobile-menu"]}
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Open navigation"
          >
            <MenuLeftIcon /> Menu
          </button>
          <Dialog.Trigger
            type="button"
            class={styles["mobile-menu"]}
            aria-label="Open table of contents"
          >
            On this page <ArrowDownIcon />
          </Dialog.Trigger>
        </div>

        <div ref={setTocRef} class={styles["toc-container"]} />
      </header>

      <Dialog.Portal mount={tocRef()}>
        <Dialog.Content
          class={styles["toc-popup"]}
          onClick={() => setTocOpen(false)}
        >
          <TableOfContents />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
