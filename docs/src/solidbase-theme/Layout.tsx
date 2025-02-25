import { Meta } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import { type ComponentProps, Show } from "solid-js";

import { useSolidBaseContext } from "../../../src/client/context";
import { useCurrentPageData } from "../../../src/client/page-data";
import Layout from "../../../src/default-theme/Layout";
import Article from "../../../src/default-theme/components/Article";
import { ComponentsProvider } from "../../../src/default-theme/context";

import { mdxComponents } from "virtual:solidbase/components";
import BetaImage from "../../assets/beta.png";
import { OGImage } from "./og-image";

export default function (props: ComponentProps<typeof Layout>) {
	const pageData = useCurrentPageData();

	return (
		<>
			<OpenGraph />
			<ComponentsProvider
				components={{
					Article: (props) => (
						<Article {...props}>
							<Show when={pageData().frontmatter.layout !== "home"}>
								{mdxComponents.DirectiveContainer({
									type: "warning",
									title: "SolidBase is currently in Beta!",
									children: mdxComponents.p({
										children:
											"Some options may not fully work or be documented.",
									}),
								})}
								<br />
							</Show>
							{props.children}
						</Article>
					),
				}}
			>
				<Layout {...props} />
			</ComponentsProvider>
		</>
	);
}

function OpenGraph() {
	const location = useLocation();

	const solidBaseCtx = useSolidBaseContext();
	const pageData = useCurrentPageData();

	return (
		<>
			<Meta name="og:type" content="website" />
			<Meta name="og:site_name" content={solidBaseCtx.config().title} />
			<Meta name="og:title" content={solidBaseCtx.title()} />
			<Meta
				name="og:description"
				content={
					pageData().frontmatter.description ??
					solidBaseCtx.config().description
				}
			/>
			<Meta
				name="og:locale"
				content={solidBaseCtx.locale.currentLocale().code}
			/>
			<Meta
				name="og:url"
				content={new URL(
					location.pathname,
					import.meta.env.VITE_ORIGIN ?? "https://solidbase.netlify.app",
				).toString()}
			/>
			<OGImage />
		</>
	);
}
