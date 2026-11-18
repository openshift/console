import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';

/**
 * ts-json-schema-generator currently doesn't support parsing constructor types, e.g. `new () => void`.
 * Represent unsupported constructor types as unconstrained schemas.
 */
export class ConstructorTypeParser implements tsj.SubNodeParser {
  supportsNode(node: ts.Node) {
    return node.kind === ts.SyntaxKind.ConstructorType;
  }

  createType(): tsj.BaseType {
    return new tsj.AnyType();
  }
}
