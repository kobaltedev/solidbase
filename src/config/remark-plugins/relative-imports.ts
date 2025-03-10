import { fromJs } from "esast-util-from-js";
import { visit } from "unist-util-visit";

export function remarkRelativeImports() {
	return (tree: any) => {
		visit(tree, (node) => {
			if (node.type !== "image") return;

			const { url } = node;
			if (!(url.startsWith("./") || url.startsWith("../"))) return;

			const ident = `$$SolidBase_RelativeImport${tree.children.length}`;

			node.url = ident;

			tree.children.push({
				type: "mdxjsEsm",
				value: "",
				data: {
					estree: fromJs(`import ${ident} from "${url}"`, { module: true }),
				},
			});
		});
	};
}
