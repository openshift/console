import * as _ from 'lodash';
import * as ts from 'typescript';
import { resolvePath } from './path';
import {
  getTypeAliasDeclaration,
  getTypeReferenceNode,
  getUnionMemberTypes,
  getJSDocComments,
  printJSDocComments,
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
  /** If `true`, this property has the optional modifier. */
  optional: boolean;
} & ContainsJSDoc;

export type ExtensionTypeInfo = {
  /** Name of the extension type, e.g. `Foo`. */
  name: string;
  /** Console extension `type` value, e.g. `console.foo`. */
  type: string;
  /** Console extension `properties` object representation. */
  properties: ExtensionPropertyInfo[];
} & ContainsJSDoc;

type ConsoleTypeResolver = {
  getDeclarations: () => ConsoleTypeDeclarations;

  getConsoleExtensions: (
    exitOnErrors?: boolean,
  ) => {
    result: ExtensionTypeInfo[];
    diagnostics: { errors: string[]; warnings: string[] };
  };
};

const parseExtensionTypeInfo = (
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  errors: string[],
): ExtensionTypeInfo => {
  const typeString = typeChecker.typeToString(type);
  const typeDeclaration = _.head(type.aliasSymbol?.declarations);

  if (!typeDeclaration || !ts.isTypeAliasDeclaration(typeDeclaration)) {
    errors.push(`Extension type '${typeString}' must be declared as type alias`);
    return null;
  }

  const refToExtensionDeclaration = getTypeReferenceNode(typeDeclaration, 'ExtensionDeclaration');

  if (refToExtensionDeclaration?.typeArguments?.length !== 2) {
    errors.push(`Extension type '${typeString}' must reference ExtensionDeclaration<T, P> type`);
    return null;
  }

  const [typeArgT, typeArgP] = refToExtensionDeclaration.typeArguments;

  if (!ts.isLiteralTypeNode(typeArgT) || !ts.isStringLiteral(typeArgT.literal)) {
    errors.push(`Extension type '${typeString}' must declare T type parameter as string literal`);
    return null;
  }

  const consoleExtensionType = typeArgT.literal.text;
  const consoleExtensionProperties: ExtensionPropertyInfo[] = [];

  typeChecker
    .getTypeFromTypeNode(typeArgP)
    .getProperties()
    .forEach((p) => {
      consoleExtensionProperties.push({
        name: p.getName(),
        // TODO(vojtech): using ts.TypeFormatFlags.MultilineObjectLiterals flag doesn't seem
        // to insert newline characters as expected, should revisit this issue in the future
        valueType: typeChecker.typeToString(
          typeChecker.getTypeOfSymbolAtLocation(p, typeArgP),
          typeArgP,
          // eslint-disable-next-line no-bitwise
          ts.TypeFormatFlags.AllowUniqueESSymbolType |
            ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
            ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType,
        ),
        // eslint-disable-next-line no-bitwise
        optional: !!(p.flags & ts.SymbolFlags.Optional),
        docComments: getJSDocComments(_.head(p.declarations)),
      });
    });

  return {
    name: typeDeclaration.name.text,
    type: consoleExtensionType,
    properties: consoleExtensionProperties,
    docComments: getJSDocComments(typeDeclaration),
  };
};

const validateExtensionTypes = (
  types: ExtensionTypeInfo[],
  errors: string[],
  warnings: string[],
) => {
  const getDuplicates = (arr: string[]) => Object.keys(_.pickBy(_.countBy(arr), (c) => c > 1));

  getDuplicates(types.map((t) => t.name)).forEach((typeName) => {
    errors.push(`Extension type '${typeName}' has multiple declarations`);
  });

  const checkComments = (prefix: string, docComments: string[]) => {
    if (!printJSDocComments(docComments)) {
      warnings.push(`${prefix} has no JSDoc comments`);
    }
  };

  types.forEach((t) => {
    checkComments(`Extension type '${t.name}'`, t.docComments);

    t.properties.forEach((p) => {
      checkComments(`Extension type '${t.name}' property '${p.name}'`, p.docComments);
    });
  });
};

export const getConsoleTypeResolver = (program: ts.Program): ConsoleTypeResolver => {
  const srcFile = (filePath: string) => program.getSourceFile(resolvePath(filePath));
  const typeChecker = program.getTypeChecker();

  return {
    getDeclarations: () => ({
      CodeRef: getTypeAliasDeclaration(srcFile('src/types.ts'), 'CodeRef'),
      EncodedCodeRef: getTypeAliasDeclaration(srcFile('src/types.ts'), 'EncodedCodeRef'),
    }),

    getConsoleExtensions: (exitOnErrors = false) => {
      const types = getUnionMemberTypes(
        typeChecker,
        getTypeAliasDeclaration(srcFile('src/schema/console-extensions.ts'), 'SupportedExtension'),
      );

      const errors: string[] = [];
      const warnings: string[] = [];

      if (types.length === 0) {
        errors.push('Union type SupportedExtension has no members');
      }

      const result = _.compact(types.map((t) => parseExtensionTypeInfo(t, typeChecker, errors)));
      validateExtensionTypes(result, errors, warnings);

      if (errors.length > 0 && exitOnErrors) {
        console.error('Detected errors while parsing Console extension type declarations');
        process.exit(1);
      }

      return { result, diagnostics: { errors, warnings } };
    },
  };
};
