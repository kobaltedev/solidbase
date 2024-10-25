import { createContextProvider } from "@solid-primitives/context";
import { createSignal } from "solid-js";

export const [ThemeContextProvider, useThemeContext] = createContextProvider(
  () => {
    const [sidebarOpen, setSidebarOpen] = createSignal(false);
    const [tocOpen, setTocOpen] = createSignal(false);

    return {
      sidebarOpen,
      setSidebarOpen,
      tocOpen,
      setTocOpen,
    };
  },
  null!,
);
