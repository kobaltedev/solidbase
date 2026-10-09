// unplugin-icons ships `types/solid` typed against solid-js 1.x, whose `ComponentProps`/`JSX`
// no longer exist in Solid 2 (they live in the renderer package). Declare the virtual modules here.
declare module "~icons/*" {
	import type { ComponentProps, JSX } from "@solidjs/web";

	const component: (props: ComponentProps<"svg">) => JSX.Element;
	export default component;
}

declare module "virtual:icons/*" {
	import type { ComponentProps, JSX } from "@solidjs/web";

	const component: (props: ComponentProps<"svg">) => JSX.Element;
	export default component;
}
