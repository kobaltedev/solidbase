import { findAndReplace } from "mdast-util-find-and-replace";
import { u } from "unist-builder";

export type IssueAutoLinkConfig = string | ((issue: string) => string);
export function remarkIssueAutolink(issueAutolink: IssueAutoLinkConfig) {
	const url = (issue: string) => {
		const number = issue.slice(1);
		if (typeof issueAutolink === "function") return issueAutolink(number);
		return issueAutolink.replace(":issue", number);
	};

	return (tree: any) => {
		findAndReplace(tree, [
			[
				/(?<=(^| ))#\d+/gm,
				(match: string) => {
					return u("link", { url: url(match) }, [u("text", match)]);
				},
			],
			[
				/\\#\d+/g,
				(match: string) => {
					return match.slice(1);
				},
			],
		]);
	};
}
