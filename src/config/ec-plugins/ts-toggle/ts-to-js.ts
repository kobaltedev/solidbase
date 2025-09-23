import { diffLines } from "diff";
import MagicString from "magic-string";
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

function processNamedImports(ms: MagicString, node: ts.ImportDeclaration) {
	const namedBindings = node.importClause!.namedBindings as ts.NamedImports;
	const valueImports = namedBindings.elements.filter((el) => !el.isTypeOnly);

	if (valueImports.length === 0) {
		ms.remove(node.getFullStart(), node.getEnd());
	} else {
		const importList = valueImports.map((imp) => imp.getText()).join(", ");
		ms.overwrite(
			namedBindings.getStart(),
			namedBindings.getEnd(),
			`{ ${importList} }`,
		);
	}
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
	const valueExports = namedExports.elements.filter(
		(element) => !element.isTypeOnly,
	);

	if (valueExports.length === 0) {
		ms.remove(node.getFullStart(), node.getEnd());
	} else {
		const exportList = valueExports.map((exp) => exp.getText()).join(", ");
		ms.overwrite(
			namedExports.getStart(),
			namedExports.getEnd(),
			`{ ${exportList} }`,
		);
	}
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

function mapMarkers(
	tsCode: string,
	jsCode: string,
	markers: Array<Marker>,
): Array<Marker> {
	if (!tsCode || !jsCode) {
		return markers.map((marker) => ({ ...marker, lines: [] }));
	}

	const changes = diffLines(tsCode, jsCode);

	const mapping = new Map<number, number>();
	let tsIndex = 0;
	let jsIndex = 0;

	for (const change of changes) {
		if (change.added) {
			jsIndex += change.count;
		} else if (change.removed) {
			tsIndex += change.count;
		} else {
			for (let i = 0; i < change.count; i++) {
				mapping.set(tsIndex + i + 1, jsIndex + i + 1);
			}
			tsIndex += change.count;
			jsIndex += change.count;
		}
	}

	return markers.map((marker) => ({
		...marker,
		lines: marker.lines
			.filter((line) => mapping.has(line))
			.map((line) => mapping.get(line)!),
	}));
}

export type MarkerType = "mark" | "ins" | "del";
export type Marker = {
	type: MarkerType;
	lines: Array<number>;
	label?: string;
};
export const MarkerTypeOrder: Array<MarkerType> = ["mark", "del", "ins"];

export async function tsToJs(
	tsCode: string,
	markers: Array<Marker>,
	isJsx?: boolean,
	postprocessJsCode?: (jsCode: string) => string | Promise<string>,
): Promise<{
	jsCode: string;
	markers: Array<Marker>;
}> {
	const ast = ts.createSourceFile(
		isJsx ? "temp.tsx" : "temp.ts",
		tsCode,
		ts.ScriptTarget.Latest,
		true,
		isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	const ms = new MagicString(tsCode);

	removeTripleSlashDirectives(ms, ast);

	function walkNode(node: ts.Node) {
		const shouldContinue = transformNode(ms, node);
		if (shouldContinue) {
			ts.forEachChild(node, walkNode);
		}
	}

	walkNode(ast);

	let jsCode = ms.toString();

	if (postprocessJsCode) {
		try {
			jsCode = await postprocessJsCode(jsCode);
		} catch (error) {
			console.error("Error during post-processing JavaScript code:", error);
		}
	}

	return {
		jsCode: jsCode,
		markers: mapMarkers(tsCode, jsCode, markers),
	};
}
