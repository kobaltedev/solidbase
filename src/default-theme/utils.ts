import { useSolidBaseContext as _useSolidBaseContext } from "../client/context";
import { useRouteConfig as _useRouteConfig } from "../client/config";
import { DefaultThemeConfig } from ".";

export function useSolidBaseContext() {
  return _useSolidBaseContext<DefaultThemeConfig>();
}

export function useRouteConfig() {
  return _useRouteConfig<DefaultThemeConfig>();
}
