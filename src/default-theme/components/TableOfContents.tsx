import { useWindowScrollPosition } from "@solid-primitives/scroll";
import { For, type JSX, Show, createEffect, createSignal } from "solid-js";
import styles from "./TableOfContents.module.css";
import { TableOfContentData, useCurrentPageData } from "../../client/page-data";

export default function TableOfContents(props: {}) {
  const toc = () => useCurrentPageData()().toc;

  const [currentSection, setCurrentSection] = createSignal<string | undefined>(
    toc()?.url,
  );

  const scroll = useWindowScrollPosition();

  const [headingPositions, setHeadingPositions] = createSignal<
    Array<{ url: string; top: number | undefined }>
  >([]);

  createEffect(() => {
    if (!toc()) return [];
    setHeadingPositions(
      flattenData(toc()!).map((url) => {
        const el = document.getElementById(url.slice(1));

        if (!el) {
          return {
            url,
            top: undefined,
          };
        }

        const style = window.getComputedStyle(el);
        const scrollMt = Number.parseFloat(style.scrollMarginTop) + 1;

        const top =
          window.scrollY + el.getBoundingClientRect().top - scrollMt - 50;

        return {
          url,
          top,
        };
      }),
    );
  });

  createEffect(() => {
    const top = scroll.y;
    let current = headingPositions()[0]?.url;

    for (const heading of headingPositions()) {
      if (!heading.top) continue;

      if (top >= heading.top) {
        current = heading.url;
      } else {
        break;
      }
    }

    setCurrentSection(current);
  });

  return (
    <Show when={toc()}>
      <nav class={styles.toc}>
        <span>On This Page</span>
        <ol>
          <TableOfContentsItem data={toc()!} current={currentSection()} />
        </ol>
      </nav>
    </Show>
  );
}

function TableOfContentsItem(props: {
  data: TableOfContentData;
  current: string | undefined;
}) {
  const [ref, setRef] = createSignal<HTMLElement>();

  const handleClick: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent> = (
    event,
  ) => {
    const header = document.querySelector("header") as HTMLElement | undefined;
    header?.setAttribute("data-scrolling-to-header", "");
    document
      .getElementById(
        (event.target as HTMLAnchorElement).getAttribute("href")!.slice(1),
      )
      ?.scrollIntoView(true);
  };

  createEffect(() => {
    const header = document.querySelector("header") as HTMLElement | undefined;
    header?.setAttribute("data-scrolling-to-header", "");
    if (props.data.url === props.current && !elementInViewport(ref()!)) {
      ref()?.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(() => header?.removeAttribute("data-scrolling-to-header"));
  });

  return (
    <li class={styles.item}>
      <a
        ref={setRef}
        onClick={handleClick}
        href={props.data.url}
        class={props.data.url === props.current ? styles.active : undefined}
      >
        {props.data.title}
      </a>
      <Show when={props.data.children && props.data.children.length > 0}>
        <ol>
          <For each={props.data.children}>
            {(nested) => (
              <TableOfContentsItem data={nested} current={props.current} />
            )}
          </For>
        </ol>
      </Show>
    </li>
  );
}

function flattenData(data: TableOfContentData): Array<string> {
  return [data?.url, ...(data?.children ?? []).flatMap(flattenData)].filter(
    Boolean,
  );
}

function elementInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight ||
        document.documentElement.clientHeight) /* or $(window).height() */ &&
    rect.right <=
      (window.innerWidth ||
        document.documentElement.clientWidth) /* or $(window).width() */
  );
}
