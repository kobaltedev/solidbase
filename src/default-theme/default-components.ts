import Article from "./components/Article.jsx";
import Features from "./components/Features.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import LastUpdated from "./components/LastUpdated.jsx";
import Link from "./components/Link.jsx";
import LocaleSelector from "./components/LocaleSelector.jsx";
import PageActions from "./components/PageActions.jsx";
import TableOfContents from "./components/TableOfContents.jsx";
import ThemeSelector from "./components/ThemeSelector.jsx";

export const defaultThemeComponents = {
	Article,
	Footer,
	Header,
	LastUpdated,
	Link,
	LocaleSelector,
	PageActions,
	TableOfContents,
	ThemeSelector,
	Hero,
	Features,
};

export type ThemeComponents = typeof defaultThemeComponents;
