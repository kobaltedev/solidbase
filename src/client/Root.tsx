import { Layout, mdxComponents } from "virtual:solidbase/components";
import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { type ParentProps, Suspense, createMemo, onMount } from "solid-js";
import { MDXProvider } from "solid-mdx";

import { useRouteSolidBaseConfig } from "./config.js";
import { SolidBaseContext } from "./context.jsx";

export function SolidBaseRoot(
	props: ParentProps & {
		currentPageData?: { deferStream?: boolean };
		meta?: {
			// allows diabling MetaProvider for cases where you've already got one
			provider?: boolean;
		};
	},
) {
	onMount(() => {
		const { $$SolidBase } = window as {
			$$SolidBase?: { initTwoslashPopups?(): void };
		};
		$$SolidBase?.initTwoslashPopups?.();
	});

	const base = () => (
		<Suspense>
			<LocaleContextProvider>
				<CurrentPageDataProvider {...props.currentPageData}>
					<MDXProvider components={mdxComponents}>
						<Inner>{props.children}</Inner>
					</MDXProvider>
				</CurrentPageDataProvider>
			</LocaleContextProvider>
		</Suspense>
	);

	const withMeta = () =>
		(props.meta?.provider ?? true) ? (
			<MetaProvider>{base()}</MetaProvider>
		) : (
			<>{base()}</>
		);

	return <>{withMeta()}</>;
}

import { LocaleContextProvider } from "./locale.js";
import { CurrentPageDataProvider, useCurrentPageData } from "./page-data.js";

export function Inner(props: ParentProps) {
	const config = useRouteSolidBaseConfig();
	const pageData = useCurrentPageData();

	const metaTitle = createMemo(() => {
		const titleTemplate =
			pageData()?.frontmatter.titleTemplate ?? config().titleTemplate;

		const title = pageData()?.frontmatter?.title;
		if (!title) {
			const title = config().title;
			if (titleTemplate) return `${title} - ${titleTemplate}`;
			return title;
		}

		if (titleTemplate?.includes(":title"))
			return titleTemplate.replace(":title", title);
		return `${title} - ${titleTemplate ?? config().title}`;
	});

	const description = () =>
		pageData()?.frontmatter?.description ?? config().description;

	return (
		<SolidBaseContext.Provider value={{ config, metaTitle }}>
			<Title>{metaTitle()}</Title>
			{description() && <Meta name="description" content={description()} />}
			<Layout>{props.children}</Layout>
		</SolidBaseContext.Provider>
	);
}
