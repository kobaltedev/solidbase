import { visit } from "unist-util-visit";

const DANGEROUSLY_SET_INNER_HTML = "dangerouslySetInnerHTML";

// rehype-expressive-code is hardcoded to use dangerouslySetInnerHtml
export function rehypeFixExpressiveCodeJsx() {
	return (tree: any) => {
		visit(
			tree,
			"mdxJsxFlowElement",
			(node: { attributes?: any[]; name: string }, index, parent) => {
				const dangrouslySetInnerHtmlAttribute = node.attributes?.find(
					(a) => a.name === DANGEROUSLY_SET_INNER_HTML,
				);
				if (!dangrouslySetInnerHtmlAttribute || index === undefined) return;

				const innerHTML =
					dangrouslySetInnerHtmlAttribute.value.data.estree.body[0].expression
						.properties[0].value.value;

				parent.children[index] = {
					type: "element",
					tagName: node.name,
					properties: node.attributes
						?.filter((n) => n.name !== DANGEROUSLY_SET_INNER_HTML)
						?.reduce(
							(acc, attr) => {
								acc[attr.name] = attr.value;
								return acc;
							},
							{
								// solid inserts this as the raw element content,
								// using children results in utf-8 encoding eg. &amp
								innerHTML,
							},
						),
				};
			},
		);
	};
}
