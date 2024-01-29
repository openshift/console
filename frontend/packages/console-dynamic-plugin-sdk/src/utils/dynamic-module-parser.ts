/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as ts from 'typescript';

const defaultCompilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  allowJs: true,
  strict: false,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmit: true,
};

/**
 * Maps each index module export to a dynamic module request (import specifier).
 */
export type DynamicModuleMap = { [exportName: string]: string };

/**
 * Map all exports of the given index module to their corresponding dynamic modules.
 *
 * Example: `@patternfly/react-core` package provides ESModules index at `dist/esm/index.js`
 * which exports Alert component related code & types via `dist/esm/components/Alert/index.js`
 * module.
 *
 * Given the example above, this function should return a mapping like so:
 * ```js
 * {
 *   Alert: 'dist/dynamic/components/Alert',
 *   AlertProps: 'dist/dynamic/components/Alert',
 *   AlertContext: 'dist/dynamic/components/Alert',
 *   // ...
 * }
 * ```
 *
 * The above mapping can be used when generating import statements like so:
 * ```ts
 * import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
 * ```
 *
 * It may happen that the same export is provided by multiple dynamic modules; in such case,
 * the resolution favors non-deprecated modules with most specific file paths, for example
 * `dist/dynamic/components/Wizard/hooks` is favored over `dist/dynamic/components/Wizard`.
 *
 * If the referenced index module does not exist, an empty object is returned.
 */
export const getDynamicModuleMap = (
  basePath: string,
  indexModule = 'dist/esm/index.js',
  resolutionField = 'module',
  tsCompilerOptions = defaultCompilerOptions,
): DynamicModuleMap => {
  if (!path.isAbsolute(basePath)) {
    throw new Error('Package base path must be absolute');
  }

  const indexModulePath = path.resolve(basePath, indexModule);

  if (!fs.existsSync(indexModulePath)) {
    return {};
  }

  const dynamicModulePathToPkgDir = glob
    .sync(`${basePath}/dist/dynamic/**/package.json`)
    .reduce<Record<string, string>>((acc, pkgFile) => {
      // eslint-disable-next-line
      const pkg = require(pkgFile);
      const pkgModule = pkg[resolutionField];

      if (!pkgModule) {
        throw new Error(`Missing field ${resolutionField} in ${pkgFile}`);
      }

      const pkgResolvedPath = path.resolve(path.dirname(pkgFile), pkgModule);
      const pkgRelativePath = path.dirname(path.relative(basePath, pkgFile));

      acc[pkgResolvedPath] = pkgRelativePath;

      return acc;
    }, {});

  const dynamicModulePaths = Object.keys(dynamicModulePathToPkgDir);

  const compilerHost = ts.createCompilerHost(tsCompilerOptions);

  const program = ts.createProgram(
    [indexModulePath, ...dynamicModulePaths],
    tsCompilerOptions,
    compilerHost,
  );

  const errorDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.category === ts.DiagnosticCategory.Error);

  if (errorDiagnostics.length > 0) {
    const { getCanonicalFileName, getCurrentDirectory, getNewLine } = compilerHost;

    console.error(
      ts.formatDiagnostics(errorDiagnostics, {
        getCanonicalFileName,
        getCurrentDirectory,
        getNewLine,
      }),
    );

    throw new Error(`Detected TypeScript errors while parsing modules at ${basePath}`);
  }

  const typeChecker = program.getTypeChecker();

  const getExportNames = (sourceFile: ts.SourceFile) =>
    typeChecker
      .getExportsOfModule(typeChecker.getSymbolAtLocation(sourceFile))
      .map((symbol) => symbol.getName());

  const indexModuleExports = getExportNames(program.getSourceFile(indexModulePath));

  const dynamicModuleExports = dynamicModulePaths.reduce<Record<string, string[]>>(
    (acc, modulePath) => {
      acc[modulePath] = getExportNames(program.getSourceFile(modulePath));
      return acc;
    },
    {},
  );

  const getMostSpecificModulePath = (modulePaths: string[]) =>
    modulePaths.reduce<string>((acc, p) => {
      const pathSpecificity = p.split(path.sep).length;
      const currSpecificity = acc.split(path.sep).length;

      if (pathSpecificity > currSpecificity) {
        return p;
      }

      if (pathSpecificity === currSpecificity) {
        return !p.endsWith('index.js') && acc.endsWith('index.js') ? p : acc;
      }

      return acc;
    }, '');

  return indexModuleExports.reduce<DynamicModuleMap>((acc, exportName) => {
    const foundModulePaths = Object.keys(dynamicModuleExports).filter((modulePath) =>
      dynamicModuleExports[modulePath].includes(exportName),
    );

    if (foundModulePaths.length > 0) {
      const nonDeprecatedModulePaths = foundModulePaths.filter(
        (modulePath) => !modulePath.split(path.sep).includes('deprecated'),
      );

      const targetModulePath = getMostSpecificModulePath(
        nonDeprecatedModulePaths.length > 0 ? nonDeprecatedModulePaths : foundModulePaths,
      );

      acc[exportName] = dynamicModulePathToPkgDir[targetModulePath];
    }

    return acc;
  }, {});
};
