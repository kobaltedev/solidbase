import type { ParentProps } from "solid-js";
import { MDXProvider } from "solid-mdx";

// @ts-ignore
import { overrideMdxComponents } from "virtual:solidbase";

import * as mdxComponents from "./components/Mdx";

export function SolidBase(props: ParentProps) {
	return (
		<MDXProvider
			components={{
				...mdxComponents,
				...overrideMdxComponents,
			}}
		>
			{props.children}
		</MDXProvider>
	);
}
