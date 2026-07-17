import Article from "./components/Article.jsx";
import Badges from "./components/Badges.jsx";
import Features from "./components/Features.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import LastUpdated from "./components/LastUpdated.jsx";
import Link from "./components/Link.jsx";
import LocaleSelector from "./components/LocaleSelector.jsx";
import ProjectSelector from "./components/ProjectSelector.jsx";
import TableOfContents from "./components/TableOfContents.jsx";
import ThemeSelector from "./components/ThemeSelector.jsx";
import VersionSelector from "./components/VersionSelector.jsx";
import DocSearch from "./components/vendor/DocSearch.jsx";

export const defaultThemeComponents = {
	Article,
	Badges,
	DocSearch,
	Footer,
	Header,
	LastUpdated,
	Link,
	LocaleSelector,
	ProjectSelector,
	TableOfContents,
	ThemeSelector,
	VersionSelector,
	Hero,
	Features,
};

export type ThemeComponents = typeof defaultThemeComponents;
