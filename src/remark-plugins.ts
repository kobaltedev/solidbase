import { findAndReplace } from "mdast-util-find-and-replace";
import { toc } from "mdast-util-toc";

export function remarkTOC() {
	return (tree: any) => {
		findAndReplace(tree, [
			[
				"[[toc]]",
				() => {
					const map = toc(tree, { ordered: true, maxDepth: 3 }).map as any;
					map.data ??= {};
					map.data.hProperties ??= {};
					map.data.hProperties["data-toc"] = "";
					return map;
				},
			],
		]);
	};
}
