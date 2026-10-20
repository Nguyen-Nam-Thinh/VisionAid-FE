import ts from 'typescript';
// Test helper (not bundled): finds Vietnamese UI copy that bypasses t()/msg()/tText().
const vietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const wrappers = new Set(['t', 'msg', 'tText']);
export interface Leftover {
  line: number;
  text: string;
}
export function findUntranslated(fileName: string, source: string): Leftover[] {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const lines = source.split('\n');
  const found: Leftover[] = [];
  // `// i18n-ignore` on the previous line exempts intentional text (e.g. a language's own name).
  const report = (node: ts.Node, text: string) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    if (!lines[line - 2]?.includes('i18n-ignore')) found.push({ line, text });
  };
  const wrapped = (node: ts.Node) => {
    const parent = node.parent;
    return (
      ts.isCallExpression(parent) &&
      ts.isIdentifier(parent.expression) &&
      wrappers.has(parent.expression.text) &&
      parent.arguments[0] === node
    );
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && vietnamese.test(node.text)) report(node, node.text.trim());
    else if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      vietnamese.test(node.text) &&
      !wrapped(node) &&
      !ts.isLiteralTypeNode(node.parent)
    )
      report(node, node.text);
    else if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
      if (parts.some((part) => vietnamese.test(part))) report(node, parts.join('…'));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}
