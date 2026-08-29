import { useLocale, useSolidBaseContext } from "@kobalte/solidbase/client";
import { DefaultThemeComponentsProvider } from "@kobalte/solidbase/default-theme/context.jsx";
import Layout from "@kobalte/solidbase/default-theme/Layout.jsx";
import { Meta } from "@solidjs/meta";
import type { ComponentProps } from "solid-js";

// import { OGImage } from "./og-image"; // re enable after start 2 vite 8 release

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
	const solidBaseCtx = useSolidBaseContext();
	const locale = useLocale();

	return (
		<>
			<Meta name="og:site_name" content={solidBaseCtx.config().title} />
			<Meta name="og:locale" content={locale.currentLocale().code} />
			{/*<OGImage />*/}
		</>
	);
}
