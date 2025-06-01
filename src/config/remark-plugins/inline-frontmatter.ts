import { SKIP, visit } from "unist-util-visit";

export function remarkInlineFrontmatter() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (node.type !== "mdxTextExpression" || parent.type !== "heading")
				return;

			if (
				!node.value.startsWith("frontmatter.") &&
				!node.value.startsWith("frontmatter[")
			)
				return;

			const scopedEval = (scope: any, script: string) =>
				Function(`"use strict"; return ${script}`).bind(scope)();

			const value = scopedEval(
				{ frontmatter: tree.data.frontmatter },
				`this.${node.value}`,
			);

			Object.assign(node, {
				type: "text",
				value,
			});

			return SKIP;
		});
	};
}
