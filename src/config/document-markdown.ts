import matter from "gray-matter";

function replaceFrontmatterTitleHeading(content: string, title: string) {
	const lines = content.split("\n");
	let inCodeFence = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const trimmedLine = line.trim();

		if (trimmedLine.startsWith("```") || trimmedLine.startsWith("~~~")) {
			inCodeFence = !inCodeFence;
			continue;
		}

		if (!inCodeFence && trimmedLine === "# {frontmatter.title}") {
			lines[i] = `# ${title}`;
		}
	}

	return lines.join("\n");
}

export function toDocumentMarkdown(source: string) {
	const { content, data } = matter(source);
	const title = typeof data.title === "string" ? data.title : undefined;

	const transformed = title
		? replaceFrontmatterTitleHeading(content, title)
		: content;

	return transformed.trim();
}
