function getThemeCookie() {
	if (!document.cookie) return undefined;
	const match = document.cookie.match(/\W?theme=(?<theme>\w+)/);
	return match?.groups?.theme;
}

document.documentElement.setAttribute(
	"data-theme",
	getThemeCookie() ??
		(window.matchMedia("(prefers-color-scheme: dark)").matches
			? "sdark"
			: "slight"),
);
