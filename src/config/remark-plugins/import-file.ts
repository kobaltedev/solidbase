// Adapted from https://github.com/kevin940726/remark-code-import MIT

import fs from "node:fs";
import { EOL } from "node:os";
import path from "node:path";
import { MetaOptions } from "@expressive-code/core";
import type { Code, Parent, Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

interface CodeImportOptions {
	preserveTrailingNewline?: boolean;
	removeRedundantIndentations?: boolean;
	rootDir?: string;
	allowImportingFromOutside?: boolean;
}

function extractLines(
	content: string,
	fromLine: number | undefined,
	hasDash: boolean,
	toLine: number | undefined,
	preserveTrailingNewline = false,
) {
	const lines = content.split(EOL);
	const start = fromLine || 1;
	let end: number;
	if (!hasDash) {
		end = start;
	} else if (toLine) {
		end = toLine;
	} else if (lines[lines.length - 1] === "" && !preserveTrailingNewline) {
		end = lines.length - 1;
	} else {
		end = lines.length;
	}
	return lines.slice(start - 1, end).join("\n");
}

export function remarkImportFile(options: CodeImportOptions = {}) {
	const rootDir = options.rootDir || process.cwd();

	if (!path.isAbsolute(rootDir)) {
		throw new Error(`"rootDir" has to be an absolute path`);
	}

	return function transformer(tree: Root, file: VFile) {
		visit(tree, (node, index, parent) => {
			if (node.type !== "code") return;

			const nodeLangMeta = new MetaOptions(node.lang ?? "");
			const langFile = nodeLangMeta.getString("file");
			const nodeMeta = new MetaOptions(node.meta ?? "");
			const fileMeta = nodeMeta.getString("file");

			const attr = langFile ?? fileMeta;

			if (!attr) {
				return;
			}

			if (!file.dirname) {
				throw new Error('"file" should be an instance of VFile');
			}

			const res =
				/^(?<path>.+?)(?:(?:#(?:L(?<from>\d+)(?<dash>-)?)?)(?:L(?<to>\d+))?)?$/.exec(
					attr,
				);
			if (!res || !res.groups || !res.groups.path) {
				throw new Error(`Unable to parse file path ${attr}`);
			}
			const filePath = res.groups.path;
			const fromLine = res.groups.from
				? Number.parseInt(res.groups.from, 10)
				: undefined;
			const hasDash = !!res.groups.dash || fromLine === undefined;
			const toLine = res.groups.to
				? Number.parseInt(res.groups.to, 10)
				: undefined;
			const rawPath = filePath.replace(/^\//, rootDir);
			const fileAbsPath = path.resolve(file.dirname, rawPath);

			if (!options.allowImportingFromOutside) {
				const relativePathFromRootDir = path.relative(rootDir, fileAbsPath);
				if (
					!rootDir ||
					relativePathFromRootDir.startsWith(`..${path.sep}`) ||
					path.isAbsolute(relativePathFromRootDir)
				) {
					throw new Error(
						`Attempted to import code from "${fileAbsPath}", which is outside from the rootDir "${rootDir}"`,
					);
				}
			}

			const filename = path.basename(fileAbsPath);
			const fileExt = filename.split(".").slice(-1)[0];
			if (langFile) node.lang = fileExt;

			node.meta = `title="${filename}" ${node.meta ?? ""}`;

			const fileContent = fs.readFileSync(fileAbsPath, "utf8");

			node.value = extractLines(
				fileContent,
				fromLine,
				hasDash,
				toLine,
				options.preserveTrailingNewline,
			);

			if (options.removeRedundantIndentations !== false) {
				node.value = stripIndent(node.value);
			}
		});
	};
}

// Adapted from https://github.com/jamiebuilds/min-indent MIT
function minIndent(str: string) {
	const match = str.match(/^[ \t]*(?=\S)/gm);

	if (!match) {
		return 0;
	}

	return match.reduce(
		(r, a) => Math.min(r, a.length),
		Number.POSITIVE_INFINITY,
	);
}

// Adapted from https://github.com/sindresorhus/strip-indent MIT
function stripIndent(str: string) {
	const indent = minIndent(str);

	if (indent === 0) {
		return str;
	}

	const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");

	return str.replace(regex, "");
}
