export type DefaultThemeTextConfig = {
	editPage: string;
	copyPage: string;
	copiedPage: string;
	copyFailedPage: string;
	replLoading: string;
	replError: string;
};

export const defaultThemeTextConfig: DefaultThemeTextConfig = {
	editPage: "Edit this page on GitHub",
	copyPage: "Copy page",
	copiedPage: "Copied!",
	copyFailedPage: "Copy failed",
	replLoading: "Loading playground…",
	replError:
		"The playground failed to load. Your browser may not support Web Workers.",
};
