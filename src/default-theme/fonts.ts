import { preloadFonts } from "virtual:solidbase/default-theme/fonts";

export function getFontPreloadLinkAttrs() {
	return preloadFonts.map(
		(font) =>
			({
				rel: "preload",
				href: font.path,
				as: "font" as const,
				crossorigin: "",
				type: `font/${font.type}`,
			}) as const,
	);
}
