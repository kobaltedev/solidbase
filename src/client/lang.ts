import { solidBaseConfig } from "virtual:solidbase";
import { getRequestEvent } from "solid-js/web";

export function getLangForPath(path: string) {
	if (!solidBaseConfig.locales) return { code: solidBaseConfig.lang };

	for (const [locale, config] of Object.entries(solidBaseConfig.locales)) {
		if (locale === "root") continue;

		if (path.startsWith(config.link ?? `/${locale}`))
			return { code: config.lang ?? locale, config };
	}

	const root = solidBaseConfig.locales.root;
	if (!root) return { code: "root" };

	return { code: "root", config: root };
}

export function getLang() {
	const e = getRequestEvent();
	if (!e) throw new Error("getLang must be called in a request context");

	return getLangForPath(new URL(e.request.url).pathname);
}
