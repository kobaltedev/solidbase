import { MetaOptions } from "@expressive-code/core";
import { SKIP, visit } from "unist-util-visit";

export interface PackageManagerConfig {
	show?: string[];
	default?: string;
	lang?: string;
	presets?: {
		[key: string]: {
			[key: string]: string;
		};
	};
}

export function remarkPackageManagerTabs(
	packageManagers: PackageManagerConfig | false,
) {
	return (tree: any) => {
		if (packageManagers === false) return;

		const resolvedManagers: PackageManagerConfig = {
			show: ["npm", "pnpm", "yarn", "bun", "deno"],
			default: "pnpm",
			lang: "sh",
			...packageManagers,
			presets: {
				npm: {
					install: "npm i ::package",
					"install-dev": "npm i ::package -D",
					run: "npm run :content",
					"run-full": "npm run :content",
					dlx: "npx :content",
					create: "npm create :content",
				},
				pnpm: {
					install: "pnpm add ::package",
					"install-dev": "pnpm add ::package -D",
					run: "pnpm :content",
					"run-full": "pnpm run :content",
					dlx: "pnpx :content-latest",
					create: "pnpm create :content-latest",
				},
				yarn: {
					install: "yarn add ::package",
					"install-dev": "yarn add ::package -D",
					run: "yarn :content",
					"run-full": "yarn run :content",
					dlx: "yarn dlx :content",
					create: "yarn create :content",
				},
				bun: {
					install: "bun add ::package",
					"install-dev": "bun add ::package -d",
					run: "bun :content",
					"run-full": "bun run :content",
					dlx: "bunx :content",
					create: "bun create :content",
				},
				deno: {
					install: "deno add npm:::package",
					"install-dev": "deno add npm:::package -D",
					run: "deno run :content",
					"run-full": "deno run :content",
					dlx: "deno run -A npm::content",
					create: "deno init --npm :content",
				},
				...packageManagers.presets,
			},
		};

		visit(tree, (node, index, parent) => {
			if (node.type === "code") {
				if (!node.lang?.startsWith("package-")) return;

				const packageManagerCommand = node.lang.slice("package-".length);

				const content: string = node.value;
				const packages = content.split(" ");

				parent.children[index!] = {
					type: "containerDirective",
					name: "tab-group",
					children: (resolvedManagers.show ?? []).map((preset: string) => {
						return {
							type: "containerDirective",
							name: "tab",
							children: [
								{
									children: [
										{
											type: "text",
											value: preset,
										},
									],
									data: {
										directiveLabel: true,
									},
								},
								{
									type: "code",
									lang: resolvedManagers.lang,
									meta: 'frame="none"',
									value: (
										resolvedManagers.presets?.[preset]?.[
											packageManagerCommand
										] ?? ":content"
									)
										.replace(":content-latest", content.replace("@latest", ""))
										.replace(":content", content)
										.replace(/(?<=^|\s)([^\s]*::package)(?=$|\s)/, (pattern) =>
											packages
												.map((pkg) => pattern.replace("::package", pkg))
												.join(" "),
										),
								},
							],
						};
					}),
					attributes: {
						codeGroup: "true",
						title: "package-manager",
					},
				};

				return [SKIP, index!];
			}
		});
	};
}
