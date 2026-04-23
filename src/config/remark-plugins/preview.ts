import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

function createMdxJsxFlowElement(
	name: string,
	children: any[],
	attributes?: Record<string, unknown>,
) {
	return {
		type: "mdxJsxFlowElement",
		name,
		children,
		attributes: Object.entries(attributes ?? {})
			.map(([attributeName, value]) => ({
				type: "mdxJsxAttribute",
				name: attributeName,
				value,
			}))
			.filter((attribute) => attribute.value !== undefined),
	};
}

function fail(file: VFile | undefined, node: any, reason: string): never {
	if (file) {
		file.fail(reason, node);
	}

	throw new Error(reason);
}

export function remarkPreview() {
	return (tree: any, file?: VFile) => {
		visit(tree, (node, index, parent) => {
			if (
				node.type !== "containerDirective" ||
				node.name !== "preview" ||
				index === undefined ||
				parent === undefined
			) {
				return;
			}

			const maybeLabel = node.children[0];
			if (maybeLabel?.data?.directiveLabel) {
				fail(file, maybeLabel, "preview directives do not support titles");
			}

			const dividerIndex = node.children.findIndex(
				(child: any) => child.type === "thematicBreak",
			);

			const stageChildren =
				dividerIndex === -1
					? node.children
					: node.children.slice(0, dividerIndex);

			if (stageChildren.length === 0) {
				fail(
					file,
					node,
					"preview directives must have content before the divider",
				);
			}

			const previewChildren = [
				createMdxJsxFlowElement("PreviewStage", stageChildren),
			];

			if (dividerIndex !== -1) {
				const panelChildren = node.children.slice(dividerIndex + 1);

				if (panelChildren.length === 0) {
					fail(
						file,
						node,
						"preview directives must have content after the divider",
					);
				}

				previewChildren.push(
					createMdxJsxFlowElement("PreviewPanel", panelChildren),
				);
			}

			parent.children[index] = createMdxJsxFlowElement(
				"Preview",
				previewChildren,
				node.attributes,
			);
		});
	};
}
