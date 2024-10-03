import { useLocation } from "@solidjs/router";
import {
  createEffect,
  createSignal,
  on,
  type Accessor,
  type Setter,
} from "solid-js";

interface TocItem {
  depth: number;
  text: string;
  slug: string;
}

// thanks kobalte :)
function updateHeadings(
  setter: Setter<Array<TocItem>>,
  depthRange: [number, number],
) {
  if (document.getElementsByTagName("article").length === 0) {
    setTimeout(() => updateHeadings(setter, depthRange), 1);
    return;
  }

  setter(
    [
      ...document
        .getElementsByTagName("article")[0]
        .querySelectorAll("h1, h2, h3, h4, h5, h6"),
    ]
      .map((element) => ({
        depth: Number(element.tagName.substr(1)),
        text: element.textContent!,
        slug: element.id,
      }))
      .filter(
        (item) => item.depth >= depthRange[0] && item.depth <= depthRange[1],
      ),
  );
}

export function createTableOfContents(depthRange: Accessor<[number, number]>) {
  const [toc, setToc] = createSignal<Array<TocItem>>([]);

  const location = useLocation();

  createEffect(
    on(
      () => [depthRange(), location.pathname] as const,
      ([depthRange, _]) => {
        updateHeadings(setToc, depthRange);
      },
    ),
  );

  return toc;
}
