import * as findUp from 'find-up';
import * as _ from 'lodash';
import * as tsj from 'ts-json-schema-generator';
import * as tsu from 'tsutils';
import * as ts from 'typescript';
import { resolvePath, relativePath } from './path';

const formatDiagnostics = (diagnostics: readonly ts.Diagnostic[], currentDirectory: string) =>
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => currentDirectory,
    getCanonicalFileName: _.identity,
    getNewLine: () => ts.sys.newLine,
  });

export const getSchemaGeneratorConfig = (srcFile: string, typeName?: string): tsj.Config => ({
  path: resolvePath(srcFile),
  type: typeName,
  tsconfig: findUp.sync('tsconfig.json'),
  topRef: false,
  jsDoc: 'extended',
  skipTypeCheck: true,
});

export const getProgram = (config: tsj.Config): ts.Program => {
  const program = tsj.createProgram(config);

  const diagnostics = ts.sortAndDeduplicateDiagnostics(ts.getPreEmitDiagnostics(program));
  if (diagnostics.length > 0) {
    console.error(formatDiagnostics(diagnostics, program.getCurrentDirectory()));
  }

  const hasDiagnosticErrors = diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error);
  if (hasDiagnosticErrors) {
    throw new Error(`Detected errors while parsing ${relativePath(config.path)}`);
  }

  return program;
};

export const getProgramFromFile = (srcFile: string): ts.Program =>
  getProgram(getSchemaGeneratorConfig(srcFile));

export const getTypeAliasDeclaration = (node: ts.Node, aliasName: string) =>
  ts.forEachChild<ts.TypeAliasDeclaration>(node, (childNode) =>
    ts.isTypeAliasDeclaration(childNode) && childNode.name.getText() === aliasName
      ? childNode
      : undefined,
  );

export const getTypeReferenceNode = (node: ts.Node, typeName: string) =>
  ts.forEachChild<ts.TypeReferenceNode>(node, (childNode) =>
    ts.isTypeReferenceNode(childNode) && childNode.typeName.getText() === typeName
      ? childNode
      : undefined,
  );

export const getUnionMemberTypes = (typeChecker: ts.TypeChecker, node: ts.Node) => {
  const nodeType = typeChecker.getTypeAtLocation(node);
  return nodeType.isUnion() ? nodeType.types : [];
};

export const getJSDoc = (node: ts.Node): ts.JSDoc[] =>
  tsu.canHaveJsDoc(node) ? tsu.getJsDoc(node) : [];

export const getJSDocComments = (node: ts.Node) => _.compact(getJSDoc(node).map((d) => d.comment));

export const printJSDocComments = (docComments: string[]) => docComments.join('\n\n').trim();
