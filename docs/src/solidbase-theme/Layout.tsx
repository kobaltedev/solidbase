import { Meta } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import { type ComponentProps, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { useLocale, useSolidBaseContext, mdxComponents } from "@kobalte/solidbase/client";
import Layout from "@kobalte/solidbase/default-theme/Layout.jsx";
import Article from "@kobalte/solidbase/default-theme/components/Article.jsx";
import { DefaultThemeComponentsProvider } from "@kobalte/solidbase/default-theme/context.js";
import { useDefaultThemeFrontmatter } from "@kobalte/solidbase/default-theme/frontmatter.js";

import { OGImage } from "./og-image";

export default function (props: ComponentProps<typeof Layout>) {
	const frontmatter = useDefaultThemeFrontmatter();

	return (
		<>
			<OpenGraph />
			<DefaultThemeComponentsProvider
				components={{
					Article: (props) => (
						<Article {...props}>
							<Show when={frontmatter()?.layout !== "home"}>
								<Dynamic component={mdxComponents.DirectiveContainer}
									type="warning"
									title="SolidBase is currently in Beta!"
								>
									<p>Some options may not fully work or be documented.</p>
								</Dynamic>
								<br />
							</Show>
							{props.children}
						</Article>
					),
				}}
			>
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
					frontmatter()?.description ??
					solidBaseCtx.config().description
				}
			/>
			<Meta
				name="og:locale"
				content={locale.currentLocale().code}
			/>
			<Meta
				name="og:url"
				content={new URL(
					location.pathname,
					import.meta.env.VITE_ORIGIN ?? "https://solidbase.netlify.app",
				).toString()}
			/>
			<Meta name="twitter:card" content="summary_large_image" />
			<OGImage />
		</>
	);
}
