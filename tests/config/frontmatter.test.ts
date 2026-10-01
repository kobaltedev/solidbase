import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import { type PluggableList, unified } from "unified";
import { describe, expect, it } from "vitest";

import { parseFrontmatter } from "../../src/config/frontmatter.js";

describe("parseFrontmatter", () => {
	it("parses YAML frontmatter", () => {
		expect(
			parseFrontmatter(
				["---", "title: Home", "sidebar: false", "---", "# Body"].join("\n"),
			),
		).toEqual({ title: "Home", sidebar: false });
	});

	it("ignores TOML fences, matching the MDX pipeline's YAML-only configuration", () => {
		expect(
			parseFrontmatter(["+++", 'title = "Home"', "+++", "# Body"].join("\n")),
		).toEqual({});
		expect(parseFrontmatter("+++\nThis is regular prose.\n+++\n")).toEqual({});
	});

	it("parses TOML when explicitly enabled through remark plugins", () => {
		expect(
			parseFrontmatter('+++\ntitle = "Home"\nllms = false\n+++\n', {
				remarkPlugins: [[remarkFrontmatter, ["yaml", "toml"]]],
			}),
		).toEqual({ title: "Home", llms: false });
	});

	it.each([false, true])(
		"honors nested presets and registration order (preset last: %j)",
		(presetLast) => {
			const preset = {
				plugins: [{ plugins: [[remarkFrontmatter, ["yaml", "toml"]]] }],
			};
			const yamlOnly: PluggableList[number] = [remarkFrontmatter, "yaml"];
			const remarkPlugins: PluggableList = presetLast
				? [yamlOnly, preset]
				: [preset, yamlOnly];
			const source = '+++\ntitle = "Home"\n+++\n';
			const tree = unified()
				.use(remarkParse)
				.use(remarkFrontmatter)
				.use(remarkPlugins)
				.parse(source);
			expect(tree.children.some((node) => node.type === "toml")).toBe(
				presetLast,
			);
			expect(parseFrontmatter(source, { remarkPlugins })).toEqual(
				presetLast ? { title: "Home" } : {},
			);
		},
	);

	it("handles CRLF line endings and a BOM", () => {
		expect(
			parseFrontmatter("\uFEFF---\r\ntitle: Home\r\n---\r\n# Body"),
		).toEqual({
			title: "Home",
		});
	});

	it("returns an empty object without frontmatter", () => {
		expect(parseFrontmatter("# Body\n\n---\ntitle: Nope\n---")).toEqual({});
		expect(parseFrontmatter("")).toEqual({});
	});

	it("returns an empty object for empty or non-object frontmatter", () => {
		expect(parseFrontmatter("---\n---\n# Body")).toEqual({});
		expect(parseFrontmatter("---\n- a\n- b\n---\n")).toEqual({});
	});

	it.each(["\n", "\r\n"])(
		"terminates empty frontmatter at the first closing fence with %j line endings",
		(newline) => {
			expect(
				parseFrontmatter(
					["---", "---", "title: Body metadata", "sidebar: false", "---"].join(
						newline,
					),
				),
			).toEqual({});
			expect(
				parseFrontmatter(["---", "---", "invalid: [yaml", "---"].join(newline)),
			).toEqual({});
		},
	);

	it("terminates non-empty frontmatter at the first closing fence", () => {
		expect(
			parseFrontmatter(
				["---", "title: Home", "---", "invalid: [yaml", "---"].join("\n"),
			),
		).toEqual({ title: "Home" });
	});

	it("returns an empty object for an unclosed frontmatter block", () => {
		expect(parseFrontmatter("---\ntitle: Home\n")).toEqual({});
	});

	it("does not evaluate JavaScript frontmatter", () => {
		expect(
			parseFrontmatter("---js\n{ title: (() => 'evaluated')() }\n---\n"),
		).toEqual({});
	});
});
