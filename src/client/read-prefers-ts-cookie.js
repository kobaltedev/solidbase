function getPrefersTsCookie() {
	if (!document.cookie) return undefined;
	const match = document.cookie.match(/\W?prefers-ts=(?<value>\w+)/);
	return match?.groups?.value;
}

document.documentElement.setAttribute(
	"data-prefers-ts",
	getPrefersTsCookie() ?? "true",
);
