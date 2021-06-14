import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';

class ConstructorType extends tsj.BaseType {
  getId() {
    return 'constructor';
  }
}

/**
 * ts-json-schema-generator currently doesn't support parsing constructor types, e.g. `new () => void`.
 * Similar to the built-in `FunctionNodeParser`, this parser simply allows such types to be parsed.
 */
export class ConstructorTypeParser implements tsj.SubNodeParser {
  supportsNode(node: ts.Node) {
    return node.kind === ts.SyntaxKind.ConstructorType;
  }

  createType() {
    return new ConstructorType();
  }
}
