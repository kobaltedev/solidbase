import type { VFileCompatible } from "vfile";
import { assertImportExists, inferNamedImports } from "./imports.js";
import type { MdxOptions } from "./types.js";

export function createTransformer(
	root: string,
	namedImports = inferNamedImports(root),
) {
	const imports = Object.entries(namedImports).map(
		([packageName, imported]) => {
			assertImportExists(packageName, root);
			return Array.isArray(imported)
				? `import { ${imported.join(", ")} } from '${packageName}'`
				: `import ${imported} from '${packageName}'`;
		},
	);

	return async function transform(
		code_mdx: VFileCompatible,
		mdxOptions?: MdxOptions,
	) {
		const mdx = await import("@mdx-js/mdx");
		// MDX output is left to Vite's pipeline: with `jsx: true` (as SolidBase
		// configures it) the JSX is compiled by the Solid plugin, otherwise MDX
		// already emits plain `jsx()` calls from `jsxImportSource`.
		const code = await mdx.compile(code_mdx, mdxOptions as any);
		return imports.concat("", code.toString()).join("\n");
	};
}
