import { useCurrentPageData } from "../page-data";

export default function TableOfContent(props: {}) {
	const toc = () => useCurrentPageData()().toc;

	return <div>{JSON.stringify(toc())}</div>;
}
