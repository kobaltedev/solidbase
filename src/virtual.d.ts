import type { Component } from "solid-js";

declare module "virtual:solidbase" {
  export const mdxComponents: Record<string, Component>;
}
