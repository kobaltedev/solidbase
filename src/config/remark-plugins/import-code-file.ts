// Adapted from https://github.com/kevin940726/remark-code-import MIT

import fs from "node:fs";
import { EOL } from "node:os";
import path from "node:path";
import { MetaOptions } from "@expressive-code/core";
import type { Code, Parent, Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import type { PluginOption } from "vite";
import { isMarkdown } from "../vite-plugin";

export interface ImportCodeFileOptions {
	preserveTrailingNewline?: boolean;
	removeRedundantIndentations?: boolean;
	transform?: (code: string, id: string) => string | undefined;
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

export function remarkImportCodeFile(options: ImportCodeFileOptions = {}) {
	return function transformer(tree: Root, file: VFile) {
		visit(tree, (node) => {
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

			const filename = path.basename(filePath);
			const fileExt = filename.split(".").slice(-1)[0];
			if (langFile) node.lang = fileExt;

			node.meta = `title="${filename}" ${node.meta ?? ""}`;

			let fileContent = fs.readFileSync(filePath, "utf8");

			const transformResult = options.transform?.(fileContent, filePath);
			if (transformResult !== undefined) fileContent = transformResult;

			node.value = extractLines(
				fileContent,
				fromLine,
				hasDash,
				toLine,
				options.preserveTrailingNewline,
			);

			if (options.removeRedundantIndentations !== false)
				node.value = stripIndent(node.value);
		});
	};
}

const FILE_REGEX = /(\w+)=(?:(["\'])((?:[^"\'\s\\]|\\.)*)(\2)|([^"\'\s]+))/g;
export function viteAliasCodeImports(): PluginOption {
	return {
		name: "solidbase:vite-alias-code-imports",
		enforce: "pre",
		async transform(code, id) {
			if (isMarkdown(id)) {
				const lines = code.split("\n");
				let isDirty = false;

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					if (!line.startsWith("```")) continue;
					if (!line.includes("file=")) continue;

					const file = line.match(FILE_REGEX)?.[0].slice("file=".length);
					if (!file) continue;

					const resolved = await this.resolve(file, id);
					if (!resolved) continue;
					lines[i] = line.replace(file, resolved.id);
					isDirty = true;
				}

				if (isDirty) {
					return lines.join("\n");
				}
			}
		},
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
