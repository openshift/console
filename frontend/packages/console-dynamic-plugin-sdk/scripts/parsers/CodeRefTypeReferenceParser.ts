import * as _ from 'lodash';
import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';
import type { ConsoleTypeDeclarations } from '../utils/type-resolver';

/**
 * Parse references to `CodeRef<T>` functions as references to `EncodedCodeRef` object literals.
 */
export class CodeRefTypeReferenceParser implements tsj.SubNodeParser {
  private lastMatchedNode: ts.Node | undefined;

  constructor(
    private readonly typeChecker: ts.TypeChecker,
    private readonly consoleTypeDeclarations: ConsoleTypeDeclarations,
    private readonly getMainParser: () => tsj.NodeParser,
  ) {}

  supportsNode(node: ts.Node) {
    if (ts.isTypeReferenceNode(node)) {
      const nodeType = this.typeChecker.getTypeAtLocation(node);
      if (nodeType.aliasSymbol?.name === 'CodeRef') {
        this.lastMatchedNode = node;
        return true;
      }
    }

    return false;
  }

  createType() {
    let replacementNode: ts.Declaration | undefined = this.consoleTypeDeclarations.EncodedCodeRef;

    // Handle re-exports: if EncodedCodeRef declaration is not found directly,
    // find it from the same module where CodeRef is defined
    if (!replacementNode && this.lastMatchedNode) {
      const nodeType = this.typeChecker.getTypeAtLocation(this.lastMatchedNode);
      const codeRefDecl = _.head(nodeType.aliasSymbol?.declarations);
      if (codeRefDecl) {
        const sourceFile = codeRefDecl.getSourceFile();
        const fileSymbol = this.typeChecker.getSymbolAtLocation(sourceFile);
        const encodedCodeRefSymbol =
          fileSymbol &&
          this.typeChecker
            .getExportsOfModule(fileSymbol)
            .find((s) => s.getName() === 'EncodedCodeRef');
        replacementNode = _.head(encodedCodeRefSymbol?.declarations);
      }
    }

    if (!replacementNode) {
      throw new Error('EncodedCodeRef declaration not found');
    }

    return new tsj.DefinitionType(
      'EncodedCodeRef',
      this.getMainParser().createType(replacementNode, new tsj.Context(replacementNode)),
    );
  }
}
