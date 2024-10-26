import type { ComponentProps } from "solid-js";

import Layout from "../../../src/default-theme/Layout";
import Article from "../../../src/default-theme/components/Article";
import { ComponentsProvider } from "../../../src/default-theme/context";
import BetaImage from "../../assets/beta.png";

export default function (props: ComponentProps<typeof Layout>) {
	return (
		<ComponentsProvider
			components={{
				Article: (props) => (
					<Article {...props}>
						<img src={BetaImage} alt="Beta" />
						{props.children}
					</Article>
				),
			}}
		>
			<Layout {...props} />
		</ComponentsProvider>
	);
}
