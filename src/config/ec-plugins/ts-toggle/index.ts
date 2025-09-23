import {
	ExpressiveCodeBlock,
	ExpressiveCodeEngine,
	MetaOptions,
	definePlugin,
} from "@expressive-code/core";
import {
	type Element,
	SKIP,
	addClassName,
	h,
	visit,
} from "expressive-code/hast";
import rangeParser from "parse-numeric-range";
import {
	type Marker,
	type MarkerType,
	MarkerTypeOrder,
	tsToJs,
} from "./ts-to-js.js";

const SUPPORTED_LANGS = ["js", "javascript", "jsx", "ts", "typescript", "tsx"];

function markerType(input: string) {
	let normalized = input;
	if (input === "add") {
		normalized = "ins";
	}
	if (input === "rem") {
		normalized = "del";
	}

	const markerType = normalized as MarkerType;
	return MarkerTypeOrder.includes(markerType) ? markerType : undefined;
}

function toJsLanguage(lang: string) {
	if (lang === "typescript") {
		return "javascript";
	}
	if (lang === "ts") {
		return "js";
	}
	if (lang === "tsx") {
		return "jsx";
	}
	return lang;
}

function addToggleToHeader(header: Element) {
	visit(header, "element", (node, index, parent) => {
		if (node.tagName === "figure") {
			addClassName(node, "has-title");
			return;
		}

		if (index === undefined || parent === undefined) {
			return;
		}

		if (node.tagName === "figcaption") {
			parent.children[index] = h("figcaption", { ...node.properties }, [
				...node.children,
				h("input", {
					type: "checkbox",
					checked: true,
					title: "Toggle language",
					"aria-label": "Toggle JS/TS",
					className: "sb-ts-toggle",
				}),
			]);

			return SKIP;
		}
	});
}

export interface TsToggleOptions {
	showTsToggleButton?: boolean | undefined;
	postprocessJsCode?: (jsCode: string) => string | Promise<string>;
}

export function ecPluginTsToggle(options: TsToggleOptions) {
	return definePlugin({
		name: "TS toggle",
		hooks: {
			postprocessRenderedBlock: async ({ renderData, codeBlock, config }) => {
				const metaOptions = new MetaOptions(codeBlock.meta);

				if (metaOptions.getBoolean("disableTsToggle")) {
					return;
				}

				if (!SUPPORTED_LANGS.includes(codeBlock.language)) {
					return;
				}

				if (
					options.showTsToggleButton &&
					metaOptions.getString("frame") !== "none"
				) {
					addToggleToHeader(renderData.blockAst);
				}

				let jsMeta = "";

				const markers: Array<Marker> = [];
				for (const {
					key,
					value,
					raw,
					valueStartDelimiter,
					valueEndDelimiter,
				} of metaOptions.list()) {
					const type = markerType(key ?? "");
					if (type && typeof value === "string") {
						markers.push({
							type,
							lines: rangeParser(value),
						});
					} else if (key === "title" && typeof value === "string") {
						const newTitle = value.replace(/\.tsx?$/, (ext) => {
							if (ext === ".tsx") {
								return ".jsx";
							}
							if (ext === ".ts") {
								return ".js";
							}
							return ext;
						});
						jsMeta += ` title=${valueStartDelimiter}${newTitle}${valueEndDelimiter}`;
					} else {
						jsMeta += ` ${raw}`;
					}
				}

				const isJsx = ["jsx", "tsx"].includes(codeBlock.language);

				const { jsCode, markers: jsMarkers } = await tsToJs(
					codeBlock.code,
					markers,
					isJsx,
					options.postprocessJsCode,
				);

				for (const { type, lines } of jsMarkers) {
					const start = Math.min(...lines);
					const end = Math.max(...lines);
					const rangeStr = start === end ? String(start) : `${start}-${end}`;
					jsMeta += ` ${type}={${rangeStr}}`;
				}

				const engine = new ExpressiveCodeEngine({
					...config,
					plugins: config.plugins.filter((v) => v.name !== "TS toggle"),
				});

				const jsBlock = new ExpressiveCodeBlock({
					code: jsCode,
					language: toJsLanguage(codeBlock.language),
					locale: codeBlock.locale,
					meta: jsMeta,
				});

				const renderedJsBlock = await engine.render(jsBlock);

				if (
					options.showTsToggleButton &&
					metaOptions.getString("frame") !== "none"
				) {
					addToggleToHeader(renderedJsBlock.renderedGroupAst);
				}

				renderData.blockAst = h("div", { className: "sb-ts-group" }, [
					renderData.blockAst,
					renderedJsBlock.renderedGroupAst.children[0],
				]);
			},
		},
	});
}
