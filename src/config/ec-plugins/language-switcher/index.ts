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

const SUPPORTED_LANGS = ["ts", "typescript", "tsx"];

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
					"aria-label": "Toggle TS/JS",
					className: "sb-ts-js-toggle",
				}),
			]);

			return SKIP;
		}
	});
}

/**
 * Options for the Language switcher plugin.
 */
export interface LanguageSwitcherOptions {
	/**
	 * Whether to show the toggle button in the code block header.
	 * @default true
	 */
	showToggleButton?: boolean;
	/**
	 * A function to process the generated JavaScript code.
	 * Defaults to formatting with prettier with default options.
	 */
	postprocessJsCode?: (code: string) => string | Promise<string>;
}

/**
 * Creates an Expressive Code plugin that adds TypeScript/JavaScript toggle functionality.
 *
 * This plugin converts TypeScript/TSX code blocks to their JavaScript/JSX equivalents
 * and renders both versions side-by-side with a toggle button.
 *
 * Supported languages: ts, typescript, tsx.
 * Other languages are not supported and will be ignored by the plugin.
 *
 * @param options - Configuration options for the plugin
 * @returns An Expressive Code plugin
 */
export function ecPluginLanguageSwitcher(options: LanguageSwitcherOptions) {
	return definePlugin({
		name: "Language switcher",
		hooks: {
			postprocessRenderedBlock: async ({ renderData, codeBlock, config }) => {
				if (!SUPPORTED_LANGS.includes(codeBlock.language)) {
					return;
				}

				const metaOptions = new MetaOptions(codeBlock.meta);

				if (metaOptions.getBoolean("withoutLanguageSwitcher")) {
					return;
				}

				if (
					options.showToggleButton &&
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

				const isJsx = codeBlock.language === "tsx";

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
					plugins: config.plugins.filter((v) => v.name !== "Language switcher"),
				});

				const jsBlock = new ExpressiveCodeBlock({
					code: jsCode,
					language: toJsLanguage(codeBlock.language),
					locale: codeBlock.locale,
					meta: jsMeta,
				});

				const renderedJsBlock = await engine.render(jsBlock);

				if (
					options.showToggleButton &&
					metaOptions.getString("frame") !== "none"
				) {
					addToggleToHeader(renderedJsBlock.renderedGroupAst);
				}

				renderData.blockAst = h("div", { className: "sb-language-group" }, [
					renderData.blockAst,
					renderedJsBlock.renderedGroupAst.children[0],
				]);
			},
		},
	});
}
