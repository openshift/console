import * as path from 'path';
import * as tsj from 'ts-json-schema-generator';
import * as ts from 'typescript';

type ExternalReferenceNode =
  ts.TypeReferenceNode | ts.ExpressionWithTypeArguments | ts.TypeQueryNode;

const hasFlag = (type: ts.Type, flag: ts.TypeFlags) =>
  // eslint-disable-next-line no-bitwise
  (type.flags & flag) !== 0;

/** Resolve out-of-scope types and keep aliases from expanding external declarations. */
export class OutOfScopeTypeParser implements tsj.SubNodeParser {
  private readonly sourceRoots: string[];

  private readonly resolvingNodes = new WeakSet<ts.Node>();

  constructor(
    private readonly typeChecker: ts.TypeChecker,
    sourceRoots: string[],
    private readonly getMainParser: () => tsj.NodeParser,
  ) {
    this.sourceRoots = sourceRoots.map((sourceRoot) => path.resolve(sourceRoot));
  }

  supportsNode(node: ts.Node): boolean {
    if (ts.isTypeAliasDeclaration(node)) {
      return !node.typeParameters?.length && this.hasOutOfScopeReference(node.type);
    }

    if (!this.isExternalReferenceNode(node) || this.resolvingNodes.has(node)) {
      return false;
    }

    const declarations = this.getResolvedSymbol(node)?.declarations;
    return (
      (declarations?.length ?? 0) > 0 &&
      declarations.every((declaration) => !this.isInScope(declaration))
    );
  }

  createType(node: ts.Node, context: tsj.Context, reference?: tsj.ReferenceType): tsj.BaseType {
    if (ts.isTypeAliasDeclaration(node)) {
      return this.createAliasType(node);
    }

    if (!this.isExternalReferenceNode(node)) {
      return new tsj.AnyType();
    }

    this.resolvingNodes.add(node);
    try {
      return this.getMainParser().createType(node, context, reference);
    } catch (error) {
      if (error instanceof tsj.UnknownNodeError) {
        return this.createReferenceFallback(node);
      }
      throw error;
    } finally {
      this.resolvingNodes.delete(node);
    }
  }

  private createReferenceFallback(node: ExternalReferenceNode): tsj.BaseType {
    const type = this.typeChecker.getTypeAtLocation(node);
    if (this.typeChecker.isArrayType(type) || this.typeChecker.isTupleType(type)) {
      return new tsj.ArrayType(new tsj.AnyType());
    }

    if (
      // eslint-disable-next-line no-bitwise
      type.flags & ts.TypeFlags.Object &&
      type.getCallSignatures().length === 0 &&
      type.getConstructSignatures().length === 0
    ) {
      const name = this.getResolvedSymbol(node)?.getName() ?? 'ExternalObject';
      return new tsj.ObjectType(`out-of-scope-${name}`, [], [], true);
    }

    return new tsj.AnyType();
  }

  private createAliasType(node: ts.TypeAliasDeclaration): tsj.BaseType {
    const type = this.typeChecker.getTypeAtLocation(node.type);
    // eslint-disable-next-line no-bitwise
    if (!(type.flags & ts.TypeFlags.Object) || type.getCallSignatures().length > 0) {
      return new tsj.AnyType();
    }

    const properties = type.getProperties().map((property) => {
      const propertyType = this.typeChecker.getTypeOfSymbolAtLocation(
        property,
        property.valueDeclaration ?? node,
      );
      // eslint-disable-next-line no-bitwise
      const isRequired = !(property.flags & ts.SymbolFlags.Optional);

      return new tsj.ObjectProperty(
        property.getName(),
        this.createShallowType(propertyType),
        isRequired,
      );
    });

    const additionalProperties = this.typeChecker.getIndexTypeOfType(type, ts.IndexKind.String)
      ? new tsj.AnyType()
      : false;

    return new tsj.ObjectType(
      `out-of-scope-alias-${node.name.text}`,
      [],
      properties,
      additionalProperties,
    );
  }

  private createShallowType(type: ts.Type): tsj.BaseType {
    if (type.isUnion()) {
      const types = type.types.filter(
        // eslint-disable-next-line no-bitwise
        (unionType) => !(unionType.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)),
      );

      if (
        types.length > 0 &&
        types.every((unionType) => hasFlag(unionType, ts.TypeFlags.StringLike))
      ) {
        return new tsj.StringType();
      }
      if (
        types.length > 0 &&
        types.every((unionType) => hasFlag(unionType, ts.TypeFlags.NumberLike))
      ) {
        return new tsj.NumberType();
      }
      if (
        types.length > 0 &&
        types.every((unionType) => hasFlag(unionType, ts.TypeFlags.BooleanLike))
      ) {
        return new tsj.BooleanType();
      }

      return new tsj.AnyType();
    }

    // eslint-disable-next-line no-bitwise
    if (type.flags & ts.TypeFlags.StringLike) {
      return new tsj.StringType();
    }
    // eslint-disable-next-line no-bitwise
    if (type.flags & ts.TypeFlags.NumberLike) {
      return new tsj.NumberType();
    }
    // eslint-disable-next-line no-bitwise
    if (type.flags & ts.TypeFlags.BooleanLike) {
      return new tsj.BooleanType();
    }

    if (this.typeChecker.isArrayType(type) || this.typeChecker.isTupleType(type)) {
      return new tsj.ArrayType(new tsj.AnyType());
    }

    // External object properties stay intentionally shallow to avoid expanding dependency graphs.
    // eslint-disable-next-line no-bitwise
    if (type.flags & ts.TypeFlags.Object) {
      return new tsj.ObjectType('out-of-scope-property', [], [], true);
    }

    return new tsj.AnyType();
  }

  private hasOutOfScopeReference(node: ts.Node): boolean {
    let found = false;
    const visit = (child: ts.Node) => {
      if (found) {
        return;
      }

      if (this.isExternalReferenceNode(child)) {
        const declarations = this.getResolvedSymbol(child)?.declarations;
        if (
          (declarations?.length ?? 0) > 0 &&
          declarations.every((declaration) => !this.isInScope(declaration))
        ) {
          found = true;
          return;
        }
      }

      ts.forEachChild(child, visit);
    };

    visit(node);
    return found;
  }

  private isExternalReferenceNode(node: ts.Node): node is ExternalReferenceNode {
    return (
      ts.isTypeReferenceNode(node) ||
      ts.isExpressionWithTypeArguments(node) ||
      ts.isTypeQueryNode(node)
    );
  }

  private isInScope(declaration: ts.Declaration) {
    const sourcePath = path.resolve(declaration.getSourceFile().fileName);
    return this.sourceRoots.some((sourceRoot) => {
      const relativePath = path.relative(sourceRoot, sourcePath);
      return (
        relativePath === '' ||
        (relativePath !== '..' &&
          !relativePath.startsWith(`..${path.sep}`) &&
          !path.isAbsolute(relativePath))
      );
    });
  }

  private getResolvedSymbol(node: ExternalReferenceNode) {
    const symbol = this.typeChecker.getSymbolAtLocation(
      ts.isTypeQueryNode(node)
        ? node.exprName
        : ts.isTypeReferenceNode(node)
          ? node.typeName
          : node.expression,
    );

    // eslint-disable-next-line no-bitwise
    return symbol && symbol.flags & ts.SymbolFlags.Alias
      ? this.typeChecker.getAliasedSymbol(symbol)
      : symbol;
  }
}
