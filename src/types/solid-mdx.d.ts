declare module "solid-mdx" {
	import type { PropsWithChildren, JSX } from "solid-js";

	export declare const MDXContext: import("solid-js").Context<{
		[k: string]: (props: any) => JSX.Element;
	}>;
	export declare const MDXProvider: (
		props: PropsWithChildren<{
			components: {
				[k: string]: (props: any) => JSX.Element;
			};
		}>,
	) => JSX.Element;
	export declare const useMDXComponents: () => {
		[k: string]: (props: any) => JSX.Element;
	};
}
