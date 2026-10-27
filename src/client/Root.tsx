import { Layout, mdxComponents } from "virtual:solidbase/components";
// Doing this instead of importing '../mdx.js' is annoying but necessary:
// MDX files import from `@kobalte/solidbase/mdx`, and this file would otherwise import
// from `../mdx.js`. Even though these both point to the same file, Vite treats them
// as different modules, resulting in this file getting its own MDXContext (id `file://.../mdx.js),
// and the MDX files sharing another (id `@kobalte/solidbase/mdx`).
import { MDXProvider } from "virtual:solidbase/mdx";
import { Meta, Title } from "@solidjs/meta";
import { useRouteMatches } from "@solidjs/router";
import { httpStatus, isServer } from "@solidjs/web";
import { createMemo, Loading, onSettled, type ParentProps } from "solid-js";
import { useRouteSolidBaseConfig } from "./config.js";
import { SolidBaseContext } from "./context.jsx";
import { PreferredLanguageCookieScript } from "./preferred-language.js";
import { ThemeCookieScript } from "./theme.js";

export function SolidBaseRoot(
	props: ParentProps & {
		currentPageData?: { deferStream?: boolean };
	},
) {
	// SolidStart answered unmatched paths with a 404; Router 2 start mode renders an empty
	// shell with 200 unless a route sets the status. Apps with a [...404] route still win.
	if (isServer) {
		const matches = useRouteMatches();
		if (matches().length === 0) httpStatus(404);
	}

	onSettled(() => {
		const { $$SolidBase } = window as {
			$$SolidBase?: { initTwoslashPopups?(): void };
		};
		$$SolidBase?.initTwoslashPopups?.();
	});

	const base = () => (
		<Loading>
			<ThemeCookieScript />
			<PreferredLanguageCookieScript />
			<SolidBaseRoutesContextProvider>
				<LocaleContextProvider>
					<CurrentPageDataProvider {...props.currentPageData}>
						<MDXProvider components={mdxComponents}>
							<Inner>{props.children}</Inner>
						</MDXProvider>
					</CurrentPageDataProvider>
				</LocaleContextProvider>
			</SolidBaseRoutesContextProvider>
		</Loading>
	);

	return <>{base()}</>;
}

import { LocaleContextProvider } from "./locale.js";
import { CurrentPageDataProvider, useCurrentPageData } from "./page-data.js";
import { SolidBaseRoutesContextProvider } from "./routes.js";

export function Inner(props: ParentProps) {
	const config = useRouteSolidBaseConfig();
	const pageData = useCurrentPageData();

	const metaTitle = createMemo(() => {
		const titleTemplate =
			pageData()?.frontmatter.titleTemplate ?? config().titleTemplate;

		const title = pageData()?.frontmatter?.title ?? config().title;

		if (titleTemplate?.includes(":title"))
			return titleTemplate.replace(":title", title);
		return `${title} - ${titleTemplate ?? config().title}`;
	});

	const description = () =>
		pageData()?.frontmatter?.description ?? config().description;

	return (
		<SolidBaseContext value={{ config, metaTitle }}>
			<Title>{metaTitle()}</Title>
			{description() && <Meta name="description" content={description()} />}
			<Layout>{props.children}</Layout>
		</SolidBaseContext>
	);
}
