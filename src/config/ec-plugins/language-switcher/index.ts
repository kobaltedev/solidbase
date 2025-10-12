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
	type Converter,
	type Formatter,
	type Marker,
	type MarkerType,
	MarkerTypeOrder,
	defaultConverter,
	defaultFormatter,
} from "./converter.js";
import {
	getLanguageSwitcherBaseStyles,
	languageSwitcherStyleSettings,
} from "./styles.js";

function getMarkerType(input: string) {
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

export interface ConversionRule {
	/**
	 * The target language ID to use for syntax highlighting after conversion.
	 * If not provided, the source language ID is used.
	 * @example "jsx"
	 */
	to?: string;
	/**
	 * A map of source file extensions to their target extensions for this language.
	 * @example { ".tsx": ".jsx", ".ts": ".js" }
	 */
	fileExtensionMap: Record<`.${string}`, `.${string}`>;
	/**
	 * An optional, custom converter for this language.
	 * If not provided, the default TypeScript-to-JavaScript converter is used.
	 *
	 * **Important**: The converter is responsible for calling the `formatter` on the
	 * transformed code before returning the final result. This is crucial for
	 * ensuring that line markers are mapped correctly after formatting.
	 */
	converter: Converter;
	/**
	 * An optional, custom formatter for this language's output.
	 * If not provided, the top-level `formatter` will be used.
	 * This function is passed to the `converter`.
	 */
	formatter?: Formatter;
}

const defaultConversions: Record<string, ConversionRule> = {
	typescript: {
		to: "javascript",
		fileExtensionMap: { ".ts": ".js" },
		converter: defaultConverter,
		formatter: defaultFormatter,
	},
	ts: {
		to: "js",
		fileExtensionMap: { ".ts": ".js" },
		converter: defaultConverter,
		formatter: defaultFormatter,
	},
	tsx: {
		to: "jsx",
		fileExtensionMap: { ".tsx": ".jsx" },
		converter: defaultConverter,
		formatter: defaultFormatter,
	},
};

/**
 * Resolves the effective conversion rules by merging default conversions with user-provided overrides.
 *
 * @param userConversions - An optional record of conversion rules or `false` to disable a default rule.
 * @returns The final conversion rules to be used by the plugin.
 */
export function getEffectiveConversions(
	userConversions?: Record<string, ConversionRule | false>,
) {
	const effectiveConversions = { ...defaultConversions };
	if (userConversions) {
		for (const lang in userConversions) {
			const rule = userConversions[lang];
			if (rule === false) {
				delete effectiveConversions[lang];
			} else if (rule) {
				effectiveConversions[lang] = { ...effectiveConversions[lang], ...rule };
			}
		}
	}

	return effectiveConversions;
}

/**
 * Converts file extensions in a filename based on language switcher conversion rules.
 */
export function convertFileExtension(
	filename: string,
	conversions: Record<string, ConversionRule>,
): string {
	const fileExtensionMap: Record<`.${string}`, `.${string}`> = {};
	for (const [lang, rule] of Object.entries(conversions)) {
		if (rule && typeof rule === "object" && rule.fileExtensionMap) {
			Object.assign(fileExtensionMap, rule.fileExtensionMap);
		}
	}

	return filename.replace(/\.[^.]+$/, (ext) => {
		const foundExt = fileExtensionMap[ext as `.${string}`]?.trim();
		return foundExt || ext;
	});
}

/**
 * Options for the Language switcher plugin.
 */
export interface EcPluginLanguageSwitcherOptions {
	/**
	 * Whether to show the toggle button in the code block header.
	 * @default true
	 */
	showToggleButton?: boolean;
	/**
	 * A map defining language conversion rules. The key is the source language ID.
	 *
	 * This allows you to extend the default conversions (e.g., add Svelte)
	 * or override them (e.g., change the formatter for TypeScript).
	 *
	 * To disable a default conversion (e.g., for "typescript"), set its value to `false`.
	 *
	 * @example
	 * {
	 *   // Override default formatter for typescript
	 *   "typescript": {
	 *     to: "javascript",
	 *     fileExtensionMap: { ".ts": ".js" },
	 *     formatter: (code) => myFormat(code)
	 *   },
	 *   // Add a new conversion for Svelte
	 *   "svelte": {
	 *     to: "javascript",
	 *     fileExtensionMap: { ".svelte": ".js" },
	 *     converter: svelteConverter,
	 *   },
	 *   // Disable the default "tsx" conversion
	 *   "tsx": false
	 * }
	 */
	conversions?: Record<string, ConversionRule | false>;
	/**
	 * A function to format the generated JavaScript code.
	 * Defaults to formatting with Prettier.
	 * This can be overridden by the `formatter` property in a `ConversionRule`.
	 */
	formatter?: Formatter;
	/**
	 * The label for the TypeScript toggle button.
	 * @default "TS"
	 */
	toggleButtonTsLabel?: string;
	/**
	 * The label for the JavaScript toggle button.
	 * @default "JS"
	 */
	toggleButtonJsLabel?: string;
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
export function ecPluginLanguageSwitcher(
	options?: EcPluginLanguageSwitcherOptions,
) {
	const effectiveOptions = options ?? {};
	effectiveOptions.showToggleButton ??= true;
	effectiveOptions.toggleButtonTsLabel ??= "TS";
	effectiveOptions.toggleButtonJsLabel ??= "JS";

	const conversions = getEffectiveConversions(effectiveOptions.conversions);

	if (effectiveOptions.formatter) {
		for (const lang in conversions) {
			const rule = conversions[lang] as ConversionRule;
			if (!rule.formatter) {
				rule.formatter = effectiveOptions.formatter;
			}
		}
	}

	return definePlugin({
		name: "Language switcher",
		styleSettings: languageSwitcherStyleSettings,
		baseStyles: (context) =>
			getLanguageSwitcherBaseStyles(context, effectiveOptions),
		hooks: {
			postprocessRenderedBlock: async ({ renderData, codeBlock, config }) => {
				const rule = conversions[codeBlock.language];
				if (!rule) {
					return;
				}

				const metaOptions = new MetaOptions(codeBlock.meta);

				if (metaOptions.getBoolean("withoutLanguageSwitcher")) {
					return;
				}

				if (
					effectiveOptions.showToggleButton &&
					metaOptions.getString("frame") !== "none"
				) {
					addToggleToHeader(renderData.blockAst);
				}

				let targetMeta = "";

				if (codeBlock.props.title) {
					const newTitle = convertFileExtension(
						codeBlock.props.title,
						conversions,
					);
					targetMeta += ` title="${newTitle}"`;
				}

				const sourceMarkers: Array<Marker> = [];
				for (const { key, value, raw, kind } of metaOptions.list()) {
					if (kind === "range") {
						const type = getMarkerType(key ?? "mark");
						if (type && typeof value === "string") {
							sourceMarkers.push({
								type,
								lines: rangeParser(value),
							});
						}
					} else if (key !== "title") {
						targetMeta += ` ${raw}`;
					}
				}

				const { targetCode, targetMarkers } = await rule.converter({
					sourceCode: codeBlock.code,
					sourceMarkers,
					sourceLanguage: codeBlock.language,
					formatter: rule.formatter,
				});

				for (const { type, lines } of targetMarkers) {
					const start = Math.min(...lines);
					const end = Math.max(...lines);
					if (start === end) {
						targetMeta += ` ${type}={${start}}`;
					} else if (end - start + 1 === lines.length) {
						targetMeta += ` ${type}={${start}-${end}}`;
					} else {
						targetMeta += ` ${type}={${lines.join(",")}}`;
					}
				}

				const engine = new ExpressiveCodeEngine({
					...config,
					plugins: config.plugins.filter((v) => v.name !== "Language switcher"),
				});

				const targetLanguage = rule.to ?? codeBlock.language;

				const targetBlock = new ExpressiveCodeBlock({
					code: targetCode,
					language: targetLanguage,
					locale: codeBlock.locale,
					meta: targetMeta,
				});

				const renderedJsBlock = await engine.render(targetBlock);

				if (
					effectiveOptions.showToggleButton &&
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
