import { diffChars } from "diff";
import MagicString from "magic-string";
import prettier from "prettier";
import { SourceMapConsumer } from "source-map";
import ts from "typescript";

const tripleSlashDirectiveRegExp =
	/^\s*\/\/\/\s*<(reference|amd-module|amd-dependency)\b.*?\/?>[\s\S]*$/;

function removeTypeParameters(
	ms: MagicString,
	node: ts.Node &
		(
			| {
					typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>;
			  }
			| {
					typeArguments?: ts.NodeArray<ts.TypeNode>;
			  }
		),
) {
	if ("typeParameters" in node && node.typeParameters) {
		ms.remove(node.typeParameters.pos - 1, node.typeParameters.end + 1);
		return;
	}

	if ("typeArguments" in node && node.typeArguments) {
		ms.remove(node.typeArguments.pos - 1, node.typeArguments.end + 1);
		return;
	}
}

function removeTripleSlashDirectives(ms: MagicString, ast: ts.SourceFile) {
	const firstStatementPos = ast.getStart();
	const directiveSection = ms.slice(0, firstStatementPos);
	const lines = directiveSection.split("\n");

	let idx = 0;
	for (const line of lines) {
		if (tripleSlashDirectiveRegExp.test(line)) {
			ms.remove(idx, idx + line.length);
		}
		idx += line.length + 1;
	}
}

function processImportDeclaration(ms: MagicString, node: ts.ImportDeclaration) {
	if (node.importClause?.isTypeOnly) {
		ms.remove(node.getFullStart(), node.getEnd());
		return;
	}

	if (
		node.importClause?.namedBindings &&
		ts.isNamedImports(node.importClause.namedBindings)
	) {
		processNamedImports(ms, node);
	}
}

function processNamedBindings(
	ms: MagicString,
	parentNode: ts.ImportDeclaration | ts.ExportDeclaration,
	namedBindings: ts.NamedImports | ts.NamedExports,
) {
	const valueBindings = namedBindings.elements.filter((el) => !el.isTypeOnly);

	if (valueBindings.length === 0) {
		ms.remove(parentNode.getFullStart(), parentNode.getEnd());
		return;
	}

	if (namedBindings.elements.every((el) => !el.isTypeOnly)) {
		return;
	}

	const allElements = namedBindings.elements;
	for (let i = 0; i < allElements.length; ) {
		if (allElements[i].isTypeOnly) {
			let j = i;
			while (j < allElements.length && allElements[j].isTypeOnly) {
				j++;
			}
			// Contiguous block of type-only bindings from i to j-1.
			const startNode = allElements[i];
			const endNode = allElements[j - 1];

			let removalStart = startNode.getFullStart();
			let removalEnd = endNode.getEnd();

			if (j < allElements.length) {
				// Block is not at the end, remove up to the start of the next element.
				removalEnd = allElements[j].getFullStart();
			} else if (i > 0) {
				// Block is at the end, remove from the end of the previous element.
				removalStart = allElements[i - 1].getEnd();
			}

			ms.remove(removalStart, removalEnd);
			i = j;
		} else {
			i++;
		}
	}
}

function processNamedImports(ms: MagicString, node: ts.ImportDeclaration) {
	const namedBindings = node.importClause!.namedBindings as ts.NamedImports;
	processNamedBindings(ms, node, namedBindings);
}

function processExportDeclaration(ms: MagicString, node: ts.ExportDeclaration) {
	if (node.isTypeOnly) {
		ms.remove(node.getFullStart(), node.getEnd());
		return;
	}

	if (node.exportClause && ts.isNamedExports(node.exportClause)) {
		processNamedExports(ms, node);
	}
}

function processNamedExports(ms: MagicString, node: ts.ExportDeclaration) {
	const namedExports = node.exportClause as ts.NamedExports;
	processNamedBindings(ms, node, namedExports);
}

function removeTypeDeclarations(ms: MagicString, node: ts.Node) {
	const isTypeDeclaration =
		ts.isTypeAliasDeclaration(node) ||
		ts.isInterfaceDeclaration(node) ||
		ts.isEnumDeclaration(node) ||
		ts.isModuleDeclaration(node);

	if (isTypeDeclaration) {
		ms.remove(node.getFullStart(), node.end);
		return true;
	}

	return false;
}

function hasModifier(node: ts.Node, modifierKind: ts.SyntaxKind): boolean {
	return (
		(node as any).modifiers?.some(
			(mod: ts.Modifier) => mod.kind === modifierKind,
		) || false
	);
}

function removeMethodSignatures(ms: MagicString, node: ts.Node) {
	const isMethodSignature =
		ts.isMethodSignature(node) ||
		ts.isCallSignatureDeclaration(node) ||
		ts.isConstructSignatureDeclaration(node) ||
		(ts.isMethodDeclaration(node) &&
			hasModifier(node, ts.SyntaxKind.AbstractKeyword));

	if (isMethodSignature) {
		ms.remove(node.getFullStart(), node.getEnd());
		return true;
	}

	return false;
}

function removeDeclareStatements(ms: MagicString, node: ts.Node) {
	const isDeclareStatement =
		(ts.isVariableStatement(node) &&
			hasModifier(node, ts.SyntaxKind.DeclareKeyword)) ||
		(ts.isFunctionDeclaration(node) &&
			hasModifier(node, ts.SyntaxKind.DeclareKeyword)) ||
		(ts.isClassDeclaration(node) &&
			hasModifier(node, ts.SyntaxKind.DeclareKeyword));

	if (isDeclareStatement) {
		ms.remove(node.getFullStart(), node.getEnd());
		return true;
	}

	return false;
}

function removeTypeAnnotation(
	ms: MagicString,
	node: ts.Node & { type?: ts.TypeNode },
) {
	if (!node.type) {
		return;
	}

	const children = node.getChildren();

	const questionToken = children.find(
		(child) => child.kind === ts.SyntaxKind.QuestionToken,
	);
	if (questionToken) {
		ms.remove(questionToken.getFullStart(), questionToken.getEnd());
	}

	const colonToken = children.find(
		(child) => child.kind === ts.SyntaxKind.ColonToken,
	);
	if (colonToken) {
		ms.remove(colonToken.getFullStart(), node.type.getEnd());
	}
}

function removeAccessModifiers(
	ms: MagicString,
	node: ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> },
) {
	const modifiersToRemove = [
		ts.SyntaxKind.PublicKeyword,
		ts.SyntaxKind.PrivateKeyword,
		ts.SyntaxKind.ProtectedKeyword,
		ts.SyntaxKind.ReadonlyKeyword,
		ts.SyntaxKind.AbstractKeyword,
		ts.SyntaxKind.OverrideKeyword,
	];

	for (const modifier of node.modifiers ?? []) {
		if (modifiersToRemove.includes(modifier.kind)) {
			ms.remove(modifier.getFullStart(), modifier.getEnd());
		}
	}
}

function processFunctionLike(
	ms: MagicString,
	node: ts.FunctionLikeDeclaration,
) {
	if (ts.isMethodDeclaration(node)) {
		// Skip abstract methods (already handled).
		if (hasModifier(node, ts.SyntaxKind.AbstractKeyword)) {
			return;
		}

		for (const modifier of node.modifiers ?? []) {
			if (modifier.kind === ts.SyntaxKind.ProtectedKeyword) {
				ms.remove(modifier.getFullStart(), modifier.getEnd());
			}
		}
	}

	removeTypeParameters(ms, node as any);

	removeTypeAnnotation(ms, node);

	for (const param of node.parameters) {
		removeAccessModifiers(ms, param);
		removeTypeAnnotation(ms, param);
	}

	if (!node.body) {
		ms.remove(node.getFullStart(), node.getEnd());
	}
}

function processPropertyDeclaration(
	ms: MagicString,
	node: ts.PropertyDeclaration,
) {
	removeAccessModifiers(ms, node);
	removeTypeAnnotation(ms, node);

	if (node.exclamationToken) {
		ms.remove(
			node.exclamationToken.getFullStart(),
			node.exclamationToken.getEnd(),
		);
	}
}

function processClassDeclaration(ms: MagicString, node: ts.ClassDeclaration) {
	const modifiersToRemove = [
		ts.SyntaxKind.AbstractKeyword,
		ts.SyntaxKind.DeclareKeyword,
	];

	for (const modifier of node.modifiers ?? []) {
		if (modifiersToRemove.includes(modifier.kind)) {
			ms.remove(modifier.getFullStart(), modifier.getEnd());
		}
	}

	removeTypeParameters(ms, node);

	for (const clause of node.heritageClauses ?? []) {
		if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
			ms.remove(clause.getFullStart(), clause.getEnd());
		}

		for (const type of clause.types) {
			removeTypeParameters(ms, type);
		}
	}
}

function transformNode(ms: MagicString, node: ts.Node): boolean {
	if (ts.isImportDeclaration(node)) {
		processImportDeclaration(ms, node);
		return false;
	}

	if (ts.isExportDeclaration(node)) {
		processExportDeclaration(ms, node);
		return false;
	}

	if (removeTypeDeclarations(ms, node)) {
		return false;
	}
	if (removeMethodSignatures(ms, node)) {
		return false;
	}
	if (removeDeclareStatements(ms, node)) {
		return false;
	}

	if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
		removeTypeParameters(ms, node);
		return true;
	}

	if (ts.isVariableDeclaration(node)) {
		removeTypeAnnotation(ms, node);
		return true;
	}

	if (
		ts.isFunctionDeclaration(node) ||
		ts.isMethodDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isArrowFunction(node) ||
		ts.isConstructorDeclaration(node) ||
		ts.isGetAccessor(node) ||
		ts.isSetAccessor(node)
	) {
		processFunctionLike(ms, node as ts.FunctionLikeDeclaration);
		return true;
	}

	if (ts.isPropertyDeclaration(node)) {
		processPropertyDeclaration(ms, node);
		return true;
	}

	if (ts.isClassDeclaration(node)) {
		processClassDeclaration(ms, node);
		return true;
	}

	if (ts.isAsExpression(node)) {
		ms.overwrite(
			node.getFullStart(),
			node.getEnd(),
			node.expression.getFullText(),
		);
		return false;
	}

	if (ts.isNonNullExpression(node)) {
		ms.remove(node.expression.getEnd(), node.getEnd());
		return true;
	}

	if (ts.isSatisfiesExpression(node)) {
		ms.overwrite(
			node.getFullStart(),
			node.getEnd(),
			node.expression.getFullText(),
		);
		return false;
	}

	return true;
}

export type MarkerType = "mark" | "ins" | "del";
export type Marker = {
	type: MarkerType;
	lines: Array<number>;
	label?: string;
};
export const MarkerTypeOrder: Array<MarkerType> = ["mark", "del", "ins"];

export type Formatter = (code: string) => string | Promise<string>;

/**
 * A function that transforms code and line markers from a source language to a target language.
 */
export type Converter = (context: {
	sourceCode: string;
	sourceMarkers: Array<Marker>;
	sourceLanguage: string;
	formatter?: Formatter;
}) => Promise<{
	targetCode: string;
	targetMarkers: Array<Marker>;
}>;

export async function defaultFormatter(jsCode: string) {
	return await prettier.format(jsCode, {
		parser: "babel",
	});
}

export const defaultConverter: Converter = async ({
	sourceCode,
	sourceMarkers,
	sourceLanguage,
	formatter,
}) => {
	const isJsx = ["tsx", "jsx"].includes(sourceLanguage);
	const fileName = isJsx ? "temp.tsx" : "temp.ts";
	const ast = ts.createSourceFile(
		fileName,
		sourceCode,
		ts.ScriptTarget.Latest,
		true,
		isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	const ms = new MagicString(sourceCode);

	removeTripleSlashDirectives(ms, ast);

	function walkNode(node: ts.Node) {
		const shouldContinue = transformNode(ms, node);
		if (shouldContinue) {
			ts.forEachChild(node, walkNode);
		}
	}

	walkNode(ast);

	const unformattedCode = ms.toString();

	const formattedCode = formatter
		? await formatter(unformattedCode)
		: unformattedCode;

	const changes = diffChars(unformattedCode, formattedCode);
	const formatMs = new MagicString(unformattedCode);

	if (changes && changes.length > 0) {
		let cursor = 0;

		for (const part of changes) {
			if (part.added) {
				formatMs.prependLeft(cursor, part.value);
				cursor -= part.count;
			} else if (part.removed) {
				formatMs.remove(cursor, cursor + part.count);
			}

			cursor += part.count;
		}
	}

	const rawJsMap = await new SourceMapConsumer(
		ms.generateMap({
			file: "temp.js",
			source: fileName,
		}),
	);
	const formattedJsMap = await new SourceMapConsumer(
		formatMs.generateMap({
			file: "temp.js",
			source: "unformatted.js",
		}),
	);

	const tsToJsMap = new Map<number, Array<number>>();
	rawJsMap.eachMapping((m) => {
		if (m.originalLine === null || m.generatedLine === null) {
			return;
		}
		if (!tsToJsMap.has(m.originalLine)) {
			tsToJsMap.set(m.originalLine, []);
		}
		const lines = tsToJsMap.get(m.originalLine)!;
		if (!lines.includes(m.generatedLine)) {
			lines.push(m.generatedLine);
		}
	});

	const unformattedToFormattedMap = new Map<number, Array<number>>();
	formattedJsMap.eachMapping((m) => {
		if (m.originalLine === null || m.generatedLine === null) {
			return;
		}
		if (!unformattedToFormattedMap.has(m.originalLine)) {
			unformattedToFormattedMap.set(m.originalLine, []);
		}
		const lines = unformattedToFormattedMap.get(m.originalLine)!;
		if (!lines.includes(m.generatedLine)) {
			lines.push(m.generatedLine);
		}
	});

	const targetMarkers: Array<Marker> = [];
	for (const sourceMarker of sourceMarkers) {
		const jsMarkerLines = new Set<number>();
		for (const tsLine of sourceMarker.lines) {
			const rawLines = tsToJsMap.get(tsLine);
			if (rawLines) {
				for (const rawLine of rawLines) {
					const formattedLines = unformattedToFormattedMap.get(rawLine);
					if (formattedLines) {
						for (const formattedLine of formattedLines) {
							jsMarkerLines.add(formattedLine);
						}
					}
				}
			}
		}
		targetMarkers.push({
			...sourceMarker,
			lines: [...jsMarkerLines].sort((a, b) => a - b),
		});
	}

	return {
		targetCode: formattedCode,
		targetMarkers: targetMarkers,
	};
};
