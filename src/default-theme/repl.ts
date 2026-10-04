import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";

import { SOLID_REPL_ROOT_CLASS } from "./repl-constants.js";

const RESET_LAYER = "@layer panda-reset {";

const REPL_CLIENT_ID = "virtual:solidbase/default-theme/repl-client";
const RESOLVED_REPL_CLIENT_STUB_ID = `\0${REPL_CLIENT_ID}`;

// solid-repl's stylesheet is written for a full-page app: a global preflight reset,
// dockview theming keyed on `#app` and dark mode keyed on a `.dark` ancestor.
// Drop the reset (Repl.module.css re-applies it scoped to the REPL) and rewrite
// the selectors so the rest only affects the embedded REPL.
export function scopeSolidReplCss(code: string) {
	let css = code;

	const start = css.indexOf(RESET_LAYER);
	if (start !== -1) {
		let depth = 0;
		let end = css.length - 1;

		for (let i = start + RESET_LAYER.length - 1; i < css.length; i++) {
			const char = css[i];
			if (char === "{") depth++;
			else if (char === "}") {
				depth--;
				if (depth === 0) {
					end = i;
					break;
				}
			}
		}

		css = css.slice(0, start) + css.slice(end + 1);
	}

	return css
		.replace(/(^|[\s,])\.dark(?=\s)/gm, '$1[data-theme*="dark"]')
		.replace(/(^|[\s,])#app(?=\s)/gm, `$1.${SOLID_REPL_ROOT_CLASS}`);
}

export function isSolidReplStylesheet(id: string) {
	const [path] = id.split("?");
	return path!.replaceAll("\\", "/").endsWith("/solid-repl/dist/bundle.css");
}

function resolveSolidReplRoot() {
	try {
		const require = createRequire(import.meta.url);
		return dirname(require.resolve("solid-repl/package.json"));
	} catch {
		return undefined;
	}
}

export function solidReplVitePlugin(): Plugin {
	const solidReplRoot = resolveSolidReplRoot();

	return {
		name: "solidbase-default-theme-repl",
		enforce: "pre",
		config(_config, env) {
			if (!solidReplRoot) return;

			return {
				// solid-repl's workers bundle Babel, which reads `process.env` at load time.
				// Defining one key makes Vite create a `process` global inside workers.
				define: {
					"process.env.NODE_DEBUG": "false",
					...(env.command === "serve" ? { global: "globalThis" } : {}),
				},
				resolve: {
					// solid-repl's compiled output imports panda's generated runtime,
					// which the package ships in dist/styled-system.
					alias: {
						"styled-system": join(solidReplRoot, "dist/styled-system"),
					},
					dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
				},
			};
		},
		resolveId(id, importer) {
			if (id !== REPL_CLIENT_ID) return;
			if (!solidReplRoot) return RESOLVED_REPL_CLIENT_STUB_ID;
			return this.resolve("./ReplClient.jsx", importer, { skipSelf: true });
		},
		load(id) {
			if (id !== RESOLVED_REPL_CLIENT_STUB_ID) return;

			return `export default function ReplClient() {
	throw new Error("Install \`solid-repl\` to use the REPL component.");
}`;
		},
		transform(code, id) {
			if (!isSolidReplStylesheet(id)) return;
			return { code: scopeSolidReplCss(code), map: null };
		},
	};
}
