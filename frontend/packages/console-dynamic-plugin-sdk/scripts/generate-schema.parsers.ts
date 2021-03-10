import * as tsj from 'ts-json-schema-generator';
import * as ts from 'ts-json-schema-generator/node_modules/typescript';

class ConstructorType extends tsj.BaseType {
  getId() {
    return 'constructor';
  }
}

export class ConstructorTypeNodeParser implements tsj.SubNodeParser {
  supportsNode(node: ts.Node) {
    return node.kind === ts.SyntaxKind.ConstructorType;
  }

  createType() {
    return new ConstructorType();
  }
}
