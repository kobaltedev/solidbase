import { type RouteSectionProps } from "@solidjs/router";
import { Suspense, createEffect, createUniqueId } from "solid-js";
import { useHead } from "@solidjs/meta";

import "../default-theme/index.css";
import readThemeCookieScript from "./read-theme-cookie.js?raw";
import { useSolidBaseContext } from "../client/context";
import { getRawTheme, getTheme } from "../client/theme";

export function Layout(props: RouteSectionProps) {
  const { Layout: _Layout } = useSolidBaseContext().components;

  createEffect(() => {
    document.documentElement.setAttribute("data-theme", getTheme());
    document.cookie = `theme=${getRawTheme()}; max-age=31536000; path=/`;
  });

  useHead({
    tag: "script",
    id: createUniqueId(),
    props: { children: readThemeCookieScript },
    setting: { close: true },
  });

  return (
    <Suspense>
      <_Layout {...props} />
    </Suspense>
  );
}

export { getTheme, setTheme } from "./theme";
export { getLocale, useLocale } from "./locale";
