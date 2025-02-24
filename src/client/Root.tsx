import { Layout, mdxComponents } from "virtual:solidbase/components";
import type { RouteSectionProps } from "@solidjs/router";
import { createMemo, Suspense } from "solid-js";
import { MDXProvider } from "solid-mdx";

import { useRouteSolidBaseConfig } from "./config";
import { SolidBaseContext } from "./context";

export function SolidBaseRoot(props: RouteSectionProps & {
	currentPageData?: { deferStream?: boolean },
 	meta?: {
    // allows diabling MetaProvider for cases where you've already got one
    provider?: boolean
  }
}) {
	const base = () => (
		<Suspense>
			<LocaleContextProvider>
				<CurrentPageDataProvider {...props.currentPageData}>
					<MDXProvider components={mdxComponents}>
						<Inner {...props} />
					</MDXProvider>
				</CurrentPageDataProvider>
			</LocaleContextProvider>
		</Suspense>
	);

	const withMeta = () => (props.meta?.provider ?? true) ? <MetaProvider>{base()}</MetaProvider> : <>{base()}</>;

	return <>{withMeta()}</>;
}

import { CurrentPageDataProvider, useCurrentPageData } from "./page-data";
import { LocaleContextProvider } from "./locale";
import { Meta, MetaProvider, Title } from "@solidjs/meta";

export function Inner(props: RouteSectionProps) {
	const config = useRouteSolidBaseConfig();
	const pageData = useCurrentPageData();

	const metaTitle = createMemo(() => {
		const titleTemplate = pageData()?.frontmatter.titleTemplate ?? config().titleTemplate ;

		const title = pageData()?.frontmatter?.title;
		if (!title) {
			const title = config().title
			if(titleTemplate) return `${title} - ${titleTemplate}`
			return title;
		}

		if (titleTemplate?.includes(":title")) return titleTemplate.replace(":title", title);
		else return `${title} - ${titleTemplate ?? config().title}`;
	});

	const description = () => pageData()?.frontmatter?.description ?? config().description;

	return (
		<SolidBaseContext.Provider value={{ config, metaTitle }}>
			<Title>{metaTitle()}</Title>
			{description() && <Meta name="description" content={description()} />}
			<Layout {...props} />
		</SolidBaseContext.Provider>
	);
}
