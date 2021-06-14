import * as _ from 'lodash';
import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';
import { ConsoleTypeDeclarations } from '../utils/type-resolver';

/**
 * Parse references to `CodeRef<T>` functions as references to `EncodedCodeRef` object literals.
 */
export class CodeRefTypeReferenceParser implements tsj.SubNodeParser {
  constructor(
    private readonly typeChecker: ts.TypeChecker,
    private readonly consoleTypeDeclarations: ConsoleTypeDeclarations,
    private readonly getMainParser: () => tsj.NodeParser,
  ) {}

  supportsNode(node: ts.Node) {
    if (ts.isTypeReferenceNode(node)) {
      const nodeType = this.typeChecker.getTypeAtLocation(node);

      return (
        nodeType.aliasSymbol?.name === 'CodeRef' &&
        _.head(nodeType.aliasSymbol?.declarations) === this.consoleTypeDeclarations.CodeRef
      );
    }

    return false;
  }

  createType() {
    const replacementNode = this.consoleTypeDeclarations.EncodedCodeRef;

    return new tsj.DefinitionType(
      'EncodedCodeRef',
      this.getMainParser().createType(replacementNode, new tsj.Context(replacementNode)),
    );
  }
}
