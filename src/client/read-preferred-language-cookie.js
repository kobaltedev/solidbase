function getPreferredLanguageCookie() {
	if (!document.cookie) return undefined;
	const match = document.cookie.match(/\W?preferred-language=(?<value>\w+)/);
	return match?.groups?.value;
}

document.documentElement.setAttribute(
	"data-preferred-language",
	getPreferredLanguageCookie() ?? "ts",
);
