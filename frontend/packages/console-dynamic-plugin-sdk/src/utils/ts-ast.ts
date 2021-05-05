import * as ts from 'typescript';

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

export const getUnionMemberTypes = (node: ts.Node, typeChecker: ts.TypeChecker) => {
  const nodeType = typeChecker.getTypeAtLocation(node);
  return nodeType.isUnion() ? nodeType.types : [];
};

export const getChildNodes = <T extends ts.Node>(
  node: ts.Node,
  filter: (childNode: ts.Node) => childNode is T,
  recursive = false,
): T[] => {
  const result: T[] = [];

  node.forEachChild((childNode) => {
    if (filter(childNode)) {
      result.push(childNode);
    }

    if (recursive) {
      result.push(...getChildNodes<T>(childNode, filter, recursive));
    }
  });

  return result;
};

export const toStringArray = <T extends ts.NamedDeclaration>(nodes: readonly T[]) =>
  nodes.map((node) => node.name?.getText());
