import * as ts from 'typescript';
import * as _ from 'lodash';
import { resolvePath } from './path';
import {
  getTypeAliasDeclaration,
  getTypeReferenceNode,
  getUnionMemberTypes,
  getJSDocComments,
} from './typescript';

export type ConsoleTypeDeclarations = Record<'CodeRef' | 'EncodedCodeRef', ts.Declaration>;

type ContainsJSDoc = {
  /** JSDoc comments attached to the corresponding AST node. */
  docComments: string[];
};

type ExtensionPropertyInfo = {
  /** Name of the property. */
  name: string;
  /** Value type signature, e.g. `CodeRef<() => void>`. */
  valueType: string;
} & ContainsJSDoc;

export type ExtensionTypeInfo = {
  /** Name of the extension type, e.g. `Foo`. */
  name: string;
  /** Console extension `type`, e.g. `console.foo`. */
  type: string;
  /** Console extension `properties`. */
  properties: ExtensionPropertyInfo[];
} & ContainsJSDoc;

type ErrorCallback = (errorMessage: string) => void;

type ConsoleTypeResolver = {
  getDeclarations: () => ConsoleTypeDeclarations;
  getConsoleExtensions: (errorCallback?: ErrorCallback) => ExtensionTypeInfo[];
};

const parseExtensionTypeInfo = (
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  errorCallback: ErrorCallback,
): ExtensionTypeInfo => {
  const typeString = typeChecker.typeToString(type);
  const typeDeclaration = _.head(type.aliasSymbol?.declarations);

  if (!typeDeclaration || !ts.isTypeAliasDeclaration(typeDeclaration)) {
    errorCallback(`Extension type '${typeString}' must be declared as type alias`);
    return null;
  }

  const refToExtensionDeclaration = getTypeReferenceNode(typeDeclaration, 'ExtensionDeclaration');

  if (refToExtensionDeclaration?.typeArguments?.length !== 2) {
    errorCallback(`Extension type '${typeString}' must reference ExtensionDeclaration<T, P> type`);
    return null;
  }

  const typeArgT = refToExtensionDeclaration.typeArguments[0];
  const typeArgP = refToExtensionDeclaration.typeArguments[1];

  let consoleExtensionType: string;
  const consoleExtensionProperties: ExtensionPropertyInfo[] = [];

  if (ts.isLiteralTypeNode(typeArgT) && ts.isStringLiteral(typeArgT.literal)) {
    consoleExtensionType = typeArgT.literal.text;
  } else {
    errorCallback(`Extension type '${typeString}' must declare T type parameter as string literal`);
    return null;
  }

  if (ts.isTypeLiteralNode(typeArgP)) {
    typeArgP.members.filter(ts.isPropertySignature).forEach((ps) => {
      consoleExtensionProperties.push({
        name: ps.name.getText(),
        valueType: typeChecker.typeToString(typeChecker.getTypeAtLocation(ps)),
        docComments: getJSDocComments(ps),
      });
    });
  } else {
    errorCallback(`Extension type '${typeString}' must declare P type parameter as object literal`);
    return null;
  }

  return {
    name: typeDeclaration.name.text,
    type: consoleExtensionType,
    properties: consoleExtensionProperties,
    docComments: getJSDocComments(typeDeclaration),
  };
};

export const getConsoleTypeResolver = (program: ts.Program): ConsoleTypeResolver => {
  const srcFile = (filePath: string) => program.getSourceFile(resolvePath(filePath));
  const typeChecker = program.getTypeChecker();

  return {
    getDeclarations: () => ({
      CodeRef: getTypeAliasDeclaration(srcFile('src/types.ts'), 'CodeRef'),
      EncodedCodeRef: getTypeAliasDeclaration(srcFile('src/types.ts'), 'EncodedCodeRef'),
    }),

    getConsoleExtensions: (errorCallback = _.noop) => {
      const types = getUnionMemberTypes(
        typeChecker,
        getTypeAliasDeclaration(srcFile('src/schema/console-extensions.ts'), 'SupportedExtension'),
      );

      if (types.length === 0) {
        errorCallback('Union type SupportedExtension has no members');
        return [];
      }

      return _.compact(types.map((t) => parseExtensionTypeInfo(t, typeChecker, errorCallback)));
    },
  };
};
