import { BaseFrontmatter, useFrontmatter } from "../client";

export function useDefaultThemeFrontmatter() {
	return useFrontmatter<DefaultThemeFrontmatter>();
}

export type RelativePageConfig =
	| string
	| false
	| {
			text?: string;
			link?: string;
	  };

interface DefaultThemeBaseFrontmatter {
	sidebar?: boolean;
	footer?: boolean;
	toc?: boolean;
	prev?: RelativePageConfig;
	next?: RelativePageConfig;
	editLink?: boolean;
	lastUpdated?: boolean;
}

interface HeroActionConfig {
	theme?: string;
	text?: string;
	link?: string;
}

export interface HeroConfig {
	name?: string;
	text?: string;
	tagline?: string;
	image?: {
		src: string;
		alt?: string;
	};
	actions?: Array<HeroActionConfig>;
}

export interface FeaturesConfig {
	icon?: string;
	title?: string;
	details?: string;
}

interface HomeLayoutFrontmatter {
	layout?: "home";
	hero?: HeroConfig;
	features?: Array<FeaturesConfig>;
}

export type DefaultThemeFrontmatter = (BaseFrontmatter & DefaultThemeBaseFrontmatter) & HomeLayoutFrontmatter;
