import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';

/**
 * Parse references to `CodeRef<T>` functions as references to `EncodedCodeRef` object literals.
 */
export class CodeRefTypeReferenceParser implements tsj.SubNodeParser {
  constructor(
    private readonly typeChecker: ts.TypeChecker,
    private readonly consoleTypeDeclarations: Record<string, ts.Declaration>,
    private readonly getMainParser: () => tsj.NodeParser,
  ) {}

  supportsNode(node: ts.Node) {
    return ts.isTypeReferenceNode(node)
      ? this.typeChecker.getTypeAtLocation(node).aliasSymbol?.name === 'CodeRef'
      : false;
  }

  createType() {
    const replacementNode = this.consoleTypeDeclarations.EncodedCodeRef;

    return new tsj.DefinitionType(
      'EncodedCodeRef',
      this.getMainParser().createType(replacementNode, new tsj.Context(replacementNode)),
    );
  }
}
