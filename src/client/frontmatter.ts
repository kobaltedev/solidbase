import { useCurrentMatches } from "@solidjs/router";
import { createResource } from "solid-js";

export function useCurrentFrontmatter() {
	const matches = useCurrentMatches();

	const [frontmatter] = createResource(matches, async (m) => {
		const key = m[m.length - 1].route.key as any;
		const component = key.$component;

		let mod: any;

		// modelled after Start's lazyRoute
		// https://github.com/solidjs/solid-start/blob/main/packages/start/src/router/lazyRoute.ts
		if (import.meta.env.DEV) {
			const manifest = import.meta.env.SSR
				? import.meta.env.MANIFEST.ssr
				: import.meta.env.MANIFEST.client;

			mod = await manifest.inputs[component.src]?.import();
		} else {
			mod = await component.import();
		}

		return (mod.frontmatter ?? {}) as Record<string, string>;
	});

	return () => frontmatter();
}
