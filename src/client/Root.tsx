import { Layout, mdxComponents } from "virtual:solidbase/components";
import type { RouteSectionProps } from "@solidjs/router";
import { Suspense } from "solid-js";
import { MDXProvider } from "solid-mdx";

import { useRouteSolidBaseConfig } from "./config";
import { SolidBaseContext } from "./context";

export function SolidBaseRoot(props: RouteSectionProps & { currentPageData?: {
	deferStream?: boolean
}}) {
	return (
		<Suspense>
			<CurrentPageDataProvider {...props.currentPageData}>
				<MDXProvider components={mdxComponents}>
					<Inner {...props} />
				</MDXProvider>
			</CurrentPageDataProvider>
		</Suspense>
	);
}

import { CurrentPageDataProvider, useCurrentPageData } from "./page-data";

export function Inner(props: RouteSectionProps) {
	const config = useRouteSolidBaseConfig();
	const pageData = useCurrentPageData();

	const title = () => {
		const t = pageData()?.frontmatter?.title;
		if (!t) return config().title;

		return (config().titleTemplate ?? ":title").replace(":title", t);
	};

	return (
		<SolidBaseContext.Provider value={{ config, title }}>
			<Layout {...props} />
		</SolidBaseContext.Provider>
	);
}
