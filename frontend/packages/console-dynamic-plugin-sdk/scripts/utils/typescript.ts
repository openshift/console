import * as findUp from 'find-up';
import * as ts from 'typescript';
import * as tsj from 'ts-json-schema-generator';
import * as tsu from 'tsutils';
import * as _ from 'lodash';
import { resolvePath } from './path';

export const getSchemaGeneratorConfig = (srcFile: string, typeName?: string): tsj.Config => ({
  path: resolvePath(srcFile),
  type: typeName,
  tsconfig: findUp.sync('tsconfig.json'),
  topRef: false,
  jsDoc: 'extended',
});

export const getProgram = (config: tsj.Config): ts.Program => tsj.createProgram(config);

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
