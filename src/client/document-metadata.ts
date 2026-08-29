import type { Location } from "@solidjs/router";

import type { BaseFrontmatter } from "./page-data.js";

type MetadataConfig = {
	description?: string;
	siteUrl?: string;
	title: string;
	titleTemplate?: string;
};

type MetadataPageData = {
	frontmatter: BaseFrontmatter;
};

export function resolveDocumentMetadata(
	config: MetadataConfig,
	frontmatter?: BaseFrontmatter,
) {
	const titleTemplate = frontmatter?.titleTemplate ?? config.titleTemplate;
	const title = frontmatter?.title ?? config.title;

	return {
		description: frontmatter?.description ?? config.description,
		title: titleTemplate?.includes(":title")
			? titleTemplate.replace(":title", title)
			: `${title} - ${titleTemplate ?? config.title}`,
	};
}

export function resolveCanonicalUrl(
	siteUrl: string | undefined,
	location: Pick<Location, "pathname">,
) {
	return siteUrl ? new URL(location.pathname, siteUrl).toString() : undefined;
}

export function resolveHeadMetadata(
	config: MetadataConfig,
	pageData: MetadataPageData | undefined,
	location: Pick<Location, "pathname">,
) {
	if (!pageData) return;

	return {
		...resolveDocumentMetadata(config, pageData.frontmatter),
		canonicalUrl: resolveCanonicalUrl(config.siteUrl, location),
	};
}
