import { MetaOptions } from "@expressive-code/core";
import { SKIP, visit } from "unist-util-visit";

export function remarkCodeTabs() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (node.type === "code") {
				const nodeMeta = new MetaOptions(node.meta ?? "");

				const key = nodeMeta.getString("tab");

				if (!nodeMeta.getBoolean("tab") && !key) return;

				const groupNodes = [];
				groupNodes.push(node);

				for (let i = index! + 1; i < parent.children.length; i++) {
					const node = parent.children[i];
					const nodeMeta = new MetaOptions(node.meta ?? "");
					if (
						node.type === "code" &&
						(key
							? nodeMeta.getString("tab") === key
							: nodeMeta.getBoolean("tab"))
					) {
						groupNodes.push(node);
					} else break;
				}

				parent.children[index!] = {
					type: "containerDirective",
					name: "tab-group",
					children: groupNodes.map((node) => {
						const nodeMeta = new MetaOptions(node.meta ?? "");

						node.meta += ' frame="none"';

						return {
							type: "containerDirective",
							name: "tab",
							children: [
								{
									children: [
										{
											type: "text",
											value: nodeMeta.getString("title"),
										},
									],
									data: {
										directiveLabel: true,
									},
								},
								node,
							],
						};
					}),
					attributes: {
						codeGroup: "true",
						title: key,
					},
				};

				parent.children.splice(index! + 1, groupNodes.length - 1);
				return [SKIP, index! + groupNodes.length];
			}
		});
	};
}
