import { visit } from "unist-util-visit";

export function remarkDirectiveContainers() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (
				node.type === "containerDirective" ||
				node.type === "leafDirective" ||
				node.type === "textDirective"
			) {
				const maybeLabel = node.children[0];
				const hasLabel = maybeLabel?.data?.directiveLabel;

				let labelText = undefined;

				if (hasLabel) {
					if (maybeLabel.children.length === 0) {
						labelText = " ";
						(node.children as any[]).shift();
					} else {
						const maybeLabelElement = maybeLabel.children[0];
						if (maybeLabelElement.type === "text") {
							labelText = maybeLabelElement.value;
							(node.children as any[]).shift();
						}
					}
				}

				const attributes = node.attributes || {};
				attributes.type = node.name;
				attributes.title ??= labelText;

				parent.children[index!] = {
					type: "mdxJsxFlowElement",
					name: "DirectiveContainer",
					children: node.children,
					attributes: Object.entries(attributes)
						.map(([name, value]) => ({ type: "mdxJsxAttribute", name, value }))
						.filter((v) => v.value !== undefined),
				};
			}
		});
	};
}
