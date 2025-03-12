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
					install: "npm i :content",
					"install-dev": "npm i :content -D",
					run: "npm run :content",
					"run-full": "npm run :content",
				},
				pnpm: {
					install: "pnpm add :content",
					"install-dev": "pnpm add :content -D",
					run: "pnpm :content",
					"run-full": "pnpm run :content",
				},
				yarn: {
					install: "yarn add :content",
					"install-dev": "yarn add :content -D",
					run: "yarn :content",
					"run-full": "yarn run :content",
				},
				bun: {
					install: "bun add :content",
					"install-dev": "bun add :content -d",
					run: "bun :content",
					"run-full": "bun run :content",
				},
				deno: {
					install: "deno add npm::content",
					"install-dev": "deno add npm::content -D",
					run: "deno run :content",
					"run-full": "deno run :content",
				},
				...packageManagers.presets,
			},
		};

		visit(tree, (node, index, parent) => {
			if (node.type === "code") {
				if (!node.lang?.startsWith("package-")) return;

				const packageManagerCommand = node.lang.slice("package-".length);

				const content = node.value;

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
									).replace(":content", content),
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
