import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import {
  isEncodedCodeRef,
  parseEncodedCodeRefValue,
} from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { extensionsFile } from '@console/dynamic-plugin-sdk/src/constants';
import { ConsoleExtensionsJSON } from '@console/dynamic-plugin-sdk/src/schema/console-extensions';
import { EncodedCodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { parseJSONC } from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import { validateConsoleExtensionsFileSchema } from '@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin';
import { Extension, ActivePlugin } from '../typings';
import { trimStartMultiLine } from '../utils/string';
import { consolePkgScope, PluginPackage } from './plugin-resolver';

const getExtensionsFilePath = (pkg: PluginPackage) => path.resolve(pkg._path, extensionsFile);

export type ActivePluginsModuleData = {
  /** Generated module source code. */
  code: string;
  /** Diagnostics collected while generating module source code. */
  diagnostics: { errors: string[]; warnings: string[] };
  /** Absolute file paths representing webpack file dependencies of the generated module. */
  fileDependencies: string[];
};

/**
 * Guess the file path of the module (e.g., the extension,
 * any barrel/index file) based on the given base path.
 *
 * Returns the base path if no file is found.
 */
const guessModuleFilePath = (
  basePath: string,
  diagnostics: ActivePluginsModuleData['diagnostics'],
) => {
  const extensions = ['.tsx', '.ts', '.jsx', '.js'];

  // Sometimes the module is an index file, but the exposed module path only specifies the directory.
  // In that case, we need an explicit check for the index file.
  const indexModulePaths = ['index.ts', 'index.js'].map((i) => path.resolve(basePath, i));

  for (const p of indexModulePaths) {
    if (fs.existsSync(p)) {
      // TODO(OCPBUGS-45847): uncomment when warnings are resolved
      // diagnostics.warnings.push(
      //   `The module ${basePath} refers to an index file ${p}. Index/barrel files are not recommended as they may cause unnecessary code to be loaded. Consider specifying the module file directly.`,
      // );
      return p;
    }
  }

  const pathsToCheck = [...extensions.map((ext) => `${basePath}${ext}`)];

  for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
      diagnostics.warnings.push(
        `The module ${basePath} refers to a file ${p}, but a file extension was not specified.`,
      );
      return p;
    }
  }

  // A file couldn't be found, return the original module path. A compilation warning
  // may be pushed by `getActivePluginsModuleData`
  return basePath;
};

const getExposedModuleFilePath = (
  pkg: PluginPackage,
  moduleName: string,
  diagnostics: ActivePluginsModuleData['diagnostics'],
) => {
  const modulePath = path.resolve(pkg._path, pkg.consolePlugin.exposedModules[moduleName]);

  return path.extname(modulePath)
    ? modulePath // Path already contains a file extension (no extra guessing needed)
    : guessModuleFilePath(modulePath, diagnostics);
};

/**
 * Generate the Console active plugins virtual module source.
 */
export const getActivePluginsModule = (
  pluginPackages: PluginPackage[],
  moduleHook: () => string = _.constant(''),
  extensionHook: (pkg: PluginPackage) => string = _.constant('[]'),
) => {
  let output = `
    ${moduleHook()}
    const activePlugins = [];
  `;

  for (const pkg of pluginPackages) {
    output = `
      ${output}
      activePlugins.push({
        name: '${pkg.name}',
        extensions: [
          ...require('${pkg.name}/${pkg.consolePlugin.entry}').default,
          ...${extensionHook(pkg)},
        ],
      });
    `;
  }

  output = `
    ${output}
    export default activePlugins;
  `;

  return trimStartMultiLine(output);
};

/**
 * Important: keep this in sync with `getActivePluginsModule` above.
 */
export const loadActivePluginsForTestPurposes = (
  pluginPackages: PluginPackage[],
  moduleHook: VoidFunction = _.noop,
  extensionHook: (pkg: PluginPackage) => Extension[] = _.constant([]),
) => {
  moduleHook();
  const activePlugins: ActivePlugin[] = [];

  for (const pkg of pluginPackages) {
    activePlugins.push({
      name: pkg.name,
      extensions: [
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        ...require(`${pkg.name}/${pkg.consolePlugin.entry}`).default,
        ...extensionHook(pkg),
      ],
    });
  }

  return activePlugins;
};

/**
 * Transform the `EncodedCodeRef` into `CodeRef` function source.
 */
export const getExecutableCodeRefSource = (
  ref: EncodedCodeRef,
  propName: string,
  pkg: PluginPackage,
  validationResult: ValidationResult,
) => {
  const [moduleName, exportName] = parseEncodedCodeRefValue(ref.$codeRef);
  const exposedModules = pkg.consolePlugin.exposedModules || {};

  const errorTrace = `in property '${propName}'`;
  const emptyCodeRefSource = '() => Promise.resolve(null)';

  if (!moduleName || !exportName) {
    validationResult.addError(`Invalid code reference '${ref.$codeRef}' ${errorTrace}`);
    return emptyCodeRefSource;
  }

  if (!exposedModules[moduleName]) {
    validationResult.addError(`Module '${moduleName}' is not exposed ${errorTrace}`);
    return emptyCodeRefSource;
  }

  const importPath = `${pkg.name}/${exposedModules[moduleName]}`;
  const pluginReference = pkg.name.replace(`${consolePkgScope}/`, '');
  const webpackChunkName = `${pluginReference}/code-refs/${moduleName}`;
  const webpackMagicComment = `/* webpackChunkName: '${webpackChunkName}' */`;

  return `() => import('${importPath}' ${webpackMagicComment}).then((m) => m.${exportName})`;
};

/**
 * Returns the array source containing the given plugin's dynamic extensions.
 *
 * If an error occurs, calls `errorCallback` and returns an empty array.
 */
export const getDynamicExtensions = (
  pkg: PluginPackage,
  extensionsFilePath: string,
  errorCallback: (errorMessage: string) => void,
  codeRefTransformer: (codeRefSource: string) => string = _.identity,
) => {
  const emptyArraySource = '[]';

  if (!fs.existsSync(extensionsFilePath)) {
    return emptyArraySource;
  }

  const ext = parseJSONC<ConsoleExtensionsJSON>(extensionsFilePath);
  const schemaValidationResult = validateConsoleExtensionsFileSchema(ext, extensionsFilePath);

  if (schemaValidationResult.hasErrors()) {
    errorCallback(schemaValidationResult.formatErrors());
    return emptyArraySource;
  }

  const codeRefValidationResult = new ValidationResult(extensionsFilePath);
  const source = JSON.stringify(
    ext,
    (key, value) =>
      isEncodedCodeRef(value)
        ? `@${codeRefTransformer(
            getExecutableCodeRefSource(value, key, pkg, codeRefValidationResult),
          )}@`
        : value,
    2,
  ).replace(/"@(.*)@"/g, '$1');

  if (codeRefValidationResult.hasErrors()) {
    errorCallback(codeRefValidationResult.formatErrors());
    return emptyArraySource;
  }

  return trimStartMultiLine(source);
};

export const getActivePluginsModuleData = (
  pluginPackages: PluginPackage[],
): ActivePluginsModuleData => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileDependencies: string[] = [];

  const code = getActivePluginsModule(
    pluginPackages,
    () => `
      import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
    `,
    (pkg) =>
      getDynamicExtensions(
        pkg,
        getExtensionsFilePath(pkg),
        (errorMessage) => {
          errors.push(errorMessage);
        },
        (codeRefSource) => `applyCodeRefSymbol(${codeRefSource})`,
      ),
  );

  for (const pkg of pluginPackages) {
    fileDependencies.push(getExtensionsFilePath(pkg));

    Object.keys(pkg.consolePlugin.exposedModules || {}).forEach((moduleName) => {
      const moduleFilePath = getExposedModuleFilePath(pkg, moduleName, { errors, warnings });

      if (fs.existsSync(moduleFilePath) && fs.statSync(moduleFilePath).isFile()) {
        fileDependencies.push(moduleFilePath);
      } else {
        errors.push(
          `Exposed module '${moduleName}' in static plugin ${pkg.name} refers to non-existent file ${moduleFilePath}`,
        );
      }
    });
  }

  return { code, diagnostics: { errors, warnings }, fileDependencies };
};
