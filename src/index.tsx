import type { ParentProps } from "solid-js";
import { MDXProvider } from "solid-mdx";

import { mdxComponents } from "virtual:solidbase";

export function SolidBase(props: ParentProps) {
  return <MDXProvider components={mdxComponents}>{props.children}</MDXProvider>;
}
