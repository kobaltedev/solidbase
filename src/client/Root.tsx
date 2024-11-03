import { Layout, mdxComponents } from "virtual:solidbase";
import { MetaProvider, Title, useHead } from "@solidjs/meta";
import type { RouteSectionProps } from "@solidjs/router";
import { Show, Suspense, createEffect, createUniqueId } from "solid-js";
import { MDXProvider } from "solid-mdx";

import { useRouteConfig } from "./config";
import { SolidBaseContext } from "./context";
import { useLocale } from "./locale";
import { CurrentPageDataContext, useCurrentPageData } from "./page-data";
import { getRawTheme, getTheme } from "./theme";

function renameCustomMdxComponents(components: Record<string, any>) {
	for (const name of Object.keys(components)) {
		if (name[0].toUpperCase() === name[0]) {
			components[`$$solidbase_${name.toLowerCase()}`] = components[name];
			components[name] = undefined;
		}
	}
	return components;
}

export function SolidBaseRoot(props: RouteSectionProps) {
	const locale = useLocale();
	const config = useRouteConfig();
	const pageData = useCurrentPageData();

	const title = () => {
		const t = pageData().frontmatter?.title;
		if (!t) return config().title;

		return (config().titleTemplate ?? ":title").replace(":title", t);
	};

	return (
		<CurrentPageDataContext.Provider value={pageData}>
			<MetaProvider>
				<Title>{title()}</Title>

				<MDXProvider
					components={renameCustomMdxComponents({
						...mdxComponents,
					})}
				>
					<SolidBaseContext.Provider value={{ locale, config, title }}>
						<Inner {...props} />
					</SolidBaseContext.Provider>
				</MDXProvider>
			</MetaProvider>
		</CurrentPageDataContext.Provider>
	);
}

import readThemeCookieScript from "./read-theme-cookie.js?raw";

export function Inner(props: RouteSectionProps) {
	createEffect(() => {
		document.documentElement.setAttribute("data-theme", getTheme());
		document.cookie = `theme=${getRawTheme()}; max-age=31536000; path=/`;
	});

	useHead({
		tag: "script",
		id: createUniqueId(),
		props: { children: readThemeCookieScript },
		setting: { close: true },
	});

	return (
		<Suspense>
			<Layout {...props} />
		</Suspense>
	);
}
