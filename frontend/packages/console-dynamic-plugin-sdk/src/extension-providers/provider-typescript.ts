import * as path from 'path';
import * as ts from 'typescript';
import * as _ from 'lodash';
import { requireFromString } from 'require-from-memory';
import { ConsolePluginMetadata } from '../schema/plugin-package';
import { ValidationResult } from '../validation/ValidationResult';
import { unquote } from '../utils/string';
import { getProgram } from '../utils/ts-program';
import { getChildNodes, toStringArray } from '../utils/ts-ast';
import { ExtensionProvider } from './provider-types';

type ParsedPluginModule = {
  /** Module specifier, e.g. `./src/utils/foo`. */
  moduleSpecifier: string;
  /** Named exports, or an empty array if there are none. */
  namedExports: string[];
  /** Default export, or `undefined` if there is none. */
  defaultExport?: string;
};

type ParsedCodeRef = {
  /** AST node that corresponds to `codeRef` call expression. */
  node: ts.CallExpression;
  /** Name of the `codeRef` call argument, e.g. `foo` for `codeRef(foo)`. */
  codeRefArgName: string;
};

const getModuleSpecifier = (d: ts.ImportDeclaration) => unquote(d.moduleSpecifier.getText());

const isPluginModule = (moduleSpecifier: string) =>
  moduleSpecifier.startsWith('.') && !path.normalize(moduleSpecifier).startsWith('../');

const getAllModuleExports = (m: ParsedPluginModule) =>
  m.defaultExport ? [m.defaultExport, ...m.namedExports] : m.namedExports;

const parsePluginModules = (declarations: ts.ImportDeclaration[]) =>
  declarations.reduce((acc, d) => {
    const moduleSpecifier = getModuleSpecifier(d);

    if (isPluginModule(moduleSpecifier)) {
      acc.push({
        moduleSpecifier,
        namedExports:
          (d.importClause?.namedBindings &&
            ts.isNamedImports(d.importClause.namedBindings) &&
            toStringArray(d.importClause.namedBindings.elements)) ||
          [],
        defaultExport: d.importClause?.name?.text,
      });
    }

    return acc;
  }, [] as ParsedPluginModule[]);

const parseCodeRefs = (expressions: ts.CallExpression[], typeChecker: ts.TypeChecker) =>
  expressions.reduce((acc, e) => {
    if (
      ts.isIdentifier(e.expression) &&
      e.expression.text === 'codeRef' &&
      e.arguments.length === 1 &&
      ts.isIdentifier(e.arguments[0])
    ) {
      const importDeclaration = ts.findAncestor<ts.ImportDeclaration>(
        _.head(typeChecker.getSymbolAtLocation(e.expression).declarations),
        ts.isImportDeclaration,
      );

      const codeRefValid =
        importDeclaration &&
        getModuleSpecifier(importDeclaration).startsWith('@console/dynamic-plugin-sdk');

      if (codeRefValid) {
        acc.push({
          node: e,
          codeRefArgName: (e.arguments[0] as ts.Identifier).text,
        });
      }
    }

    return acc;
  }, [] as ParsedCodeRef[]);

const transformSource = (
  srcFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  exposedModules: ConsolePluginMetadata['exposedModules'],
  validationResult: ValidationResult,
) => {
  const pluginModules = parsePluginModules(
    getChildNodes<ts.ImportDeclaration>(srcFile, ts.isImportDeclaration),
  );

  const codeRefs = parseCodeRefs(
    getChildNodes<ts.CallExpression>(srcFile, ts.isCallExpression, true),
    typeChecker,
  );

  const printer = ts.createPrinter(
    { removeComments: true },
    {
      substituteNode: (hint, node) => {
        // 1. replace `codeRef` function calls with `EncodedCodeRef` object literals
        if (ts.isCallExpression(node)) {
          const codeRef = codeRefs.find((ref) => ref.node === node);

          const pluginModule =
            codeRef &&
            pluginModules.find((m) => getAllModuleExports(m).includes(codeRef.codeRefArgName));

          const exposedModuleName =
            pluginModule &&
            _.findKey(exposedModules, (modulePath) => modulePath === pluginModule.moduleSpecifier);

          const codeRefValue =
            exposedModuleName &&
            (codeRef.codeRefArgName === pluginModule.defaultExport
              ? exposedModuleName
              : `${exposedModuleName}.${codeRef.codeRefArgName}`);

          if (codeRefValue) {
            return ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                '$codeRef',
                ts.factory.createStringLiteral(codeRefValue),
              ),
            ]);
          }

          if (codeRef) {
            validationResult.addError(
              `Failed to process code reference expression '${codeRef.node.getText()}'`,
            );
          }
        }

        // 2. replace `ConsoleExtensions` type references with `{}[]` to avoid typing errors
        if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'ConsoleExtensions') {
          return ts.factory.createArrayTypeNode(ts.factory.createTypeLiteralNode([]));
        }

        // 3. remove imports for modules which have their export(s) referenced via `codeRef` calls
        if (ts.isImportDeclaration(node)) {
          const pluginModule = pluginModules.find(
            (m) => m.moduleSpecifier === getModuleSpecifier(node),
          );

          if (
            pluginModule &&
            !_.isEmpty(
              _.intersection(
                getAllModuleExports(pluginModule),
                codeRefs.map((ref) => ref.codeRefArgName),
              ),
            )
          ) {
            return ts.factory.createEmptyStatement();
          }
        }

        return node;
      },
    },
  );

  return printer.printNode(ts.EmitHint.Unspecified, srcFile, srcFile);
};

const getTransformedFilePath = (filePath: string) => {
  const { dir, name, ext } = path.parse(filePath);
  return path.join(dir, `${name}-transformed${ext}`);
};

export const parseExtensionsFromTypeScript: ExtensionProvider = (filePath, exposedModules) => {
  const program = getProgram(filePath);
  const srcFile = program.getSourceFile(filePath);
  const typeChecker = program.getTypeChecker();

  const transformValidationResult = new ValidationResult(filePath);
  const code = transformSource(srcFile, typeChecker, exposedModules, transformValidationResult);

  transformValidationResult.report();

  const transformedFilePath = getTransformedFilePath(filePath);

  return requireFromString(code, transformedFilePath, {
    logFilter: ({ level, type, filename }) =>
      // Suppress warnings caused by vendor libs (e.g. fsevents) trying to load transformed file
      !(level === 'WARNING' && type === 'FindPath' && filename === transformedFilePath),
  }).default;
};
