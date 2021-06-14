import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';
import { ExtensionTypeInfo } from '../utils/type-resolver';

/**
 * Console extension types are declared as type aliases `type Foo = ExtensionDeclaration<T, P>`.
 * This parser embeds type declaration for the specific `ExtensionDeclaration<T, P>` type alias
 * into the `Foo` type declaration, reducing complexity of the generated JSON schema.
 */
export class ExtensionDeclarationParser implements tsj.SubNodeParser {
  constructor(
    private readonly annotationsReader: tsj.AnnotationsReader,
    private readonly consoleExtensions: ExtensionTypeInfo[],
    private readonly getMainParser: () => tsj.NodeParser,
  ) {}

  supportsNode(node: ts.Node) {
    return (
      ts.isTypeAliasDeclaration(node) &&
      this.consoleExtensions.some((e) => e.name === node.name.text)
    );
  }

  createType(node: ts.TypeAliasDeclaration) {
    let aliasType = this.getMainParser().createType(node.type, new tsj.Context(node.type));
    const annotations = this.annotationsReader.getAnnotations(node) || {};

    if (aliasType instanceof tsj.AnnotatedType) {
      aliasType = new tsj.AnnotatedType(aliasType.getType(), annotations, false);
    } else {
      aliasType = new tsj.AnnotatedType(aliasType, annotations, false);
    }

    return new tsj.DefinitionType(node.name.text, aliasType);
  }
}
