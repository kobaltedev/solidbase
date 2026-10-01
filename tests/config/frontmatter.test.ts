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

	it("parses TOML frontmatter", () => {
		expect(
			parseFrontmatter(["+++", 'title = "Home"', "+++", "# Body"].join("\n")),
		).toEqual({ title: "Home" });
	});

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

	it("does not evaluate JavaScript frontmatter", () => {
		expect(
			parseFrontmatter("---js\n{ title: (() => 'evaluated')() }\n---\n"),
		).toEqual({});
	});
});
