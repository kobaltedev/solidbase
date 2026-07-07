import { useLocale, useSolidBaseContext } from "@kobalte/solidbase/client";
import { DefaultThemeComponentsProvider } from "@kobalte/solidbase/default-theme/context.jsx";
import { useDefaultThemeFrontmatter } from "@kobalte/solidbase/default-theme/frontmatter.js";
import Layout from "@kobalte/solidbase/default-theme/Layout.jsx";
import { Meta } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import type { ComponentProps } from "solid-js";

// import { OGImage } from "./og-image"; // re enable after start 2 viite 8 release

export default function (props: ComponentProps<typeof Layout>) {
	return (
		<>
			<OpenGraph />
			<DefaultThemeComponentsProvider components={{}}>
				<Layout {...props} />
			</DefaultThemeComponentsProvider>
		</>
	);
}

function OpenGraph() {
	const location = useLocation();

	const solidBaseCtx = useSolidBaseContext();
	const locale = useLocale();
	const frontmatter = useDefaultThemeFrontmatter();

	return (
		<>
			<Meta name="og:type" content="website" />
			<Meta name="og:site_name" content={solidBaseCtx.config().title} />
			<Meta name="og:title" content={solidBaseCtx.metaTitle()} />
			<Meta
				name="og:description"
				content={
					frontmatter()?.description ?? solidBaseCtx.config().description
				}
			/>
			<Meta name="og:locale" content={locale.currentLocale().code} />
			<Meta
				name="og:url"
				content={new URL(
					location.pathname,
					solidBaseCtx.config().siteUrl ??
						import.meta.env.VITE_ORIGIN ??
						"https://solidbase.netlify.app",
				).toString()}
			/>
			<Meta name="twitter:card" content="summary_large_image" />
			{/*<OGImage />*/}
		</>
	);
}
