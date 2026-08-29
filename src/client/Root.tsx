import { Layout, mdxComponents } from "virtual:solidbase/components";
// Doing this instead of importing '../mdx.js' is annoying but necessary:
// MDX files import from `@kobalte/solidbase/mdx`, and this file would otherwise import
// from `../mdx.js`. Even though these both point to the same file, Vite treats them
// as different modules, resulting in this file getting its own MDXContext (id `file://.../mdx.js),
// and the MDX files sharing another (id `@kobalte/solidbase/mdx`).
import { MDXProvider } from "virtual:solidbase/mdx";
import { Link, Meta, MetaProvider, Title } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import {
	createMemo,
	onMount,
	type ParentProps,
	Show,
	Suspense,
} from "solid-js";
import { useRouteSolidBaseConfig } from "./config.js";
import { SolidBaseContext } from "./context.jsx";
import {
	resolveDocumentMetadata,
	resolveHeadMetadata,
} from "./document-metadata.js";

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
			<SolidBaseRoutesContextProvider>
				<LocaleContextProvider>
					<CurrentPageDataProvider {...props.currentPageData}>
						<MDXProvider components={mdxComponents}>
							<Inner>{props.children}</Inner>
						</MDXProvider>
					</CurrentPageDataProvider>
				</LocaleContextProvider>
			</SolidBaseRoutesContextProvider>
		</Suspense>
	);

	const withMeta = () =>
		(props.meta?.provider ?? true) ? (
			<MetaProvider>{base()}</MetaProvider>
		) : (
			base()
		);

	return <>{withMeta()}</>;
}

import { LocaleContextProvider } from "./locale.js";
import { CurrentPageDataProvider, useCurrentPageData } from "./page-data.js";
import { SolidBaseRoutesContextProvider } from "./routes.js";

export function Inner(props: ParentProps) {
	const config = useRouteSolidBaseConfig();
	const location = useLocation();
	const pageData = useCurrentPageData();
	// @solidjs/meta cannot retract tags from an incomplete SSR pass.
	const metadata = createMemo(() =>
		resolveHeadMetadata(config(), pageData(), location),
	);
	const metaTitle = () =>
		metadata()?.title ?? resolveDocumentMetadata(config()).title;

	return (
		<SolidBaseContext.Provider value={{ config, metaTitle }}>
			<Show when={metadata()} keyed>
				{(head) => (
					<>
						<Title>{head.title}</Title>
						<Show when={head.description} keyed>
							{(description) => (
								<>
									<Meta name="description" content={description} />
									<Meta property="og:description" content={description} />
									<Meta name="twitter:description" content={description} />
								</>
							)}
						</Show>
						<Meta property="og:title" content={head.title} />
						<Meta property="og:type" content="website" />
						<Show when={head.canonicalUrl} keyed>
							{(url) => (
								<>
									<Link rel="canonical" href={url} />
									<Meta property="og:url" content={url} />
								</>
							)}
						</Show>
						<Meta name="twitter:card" content="summary" />
						<Meta name="twitter:title" content={head.title} />
					</>
				)}
			</Show>
			<Layout>{props.children}</Layout>
		</SolidBaseContext.Provider>
	);
}
