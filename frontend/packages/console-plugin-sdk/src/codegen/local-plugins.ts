import * as fs from 'fs';
import * as path from 'path';
import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import {
  isEncodedCodeRef,
  parseEncodedCodeRefValue,
} from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { extensionsFile } from '@console/dynamic-plugin-sdk/src/constants';
import { ConsoleExtensionsJSON } from '@console/dynamic-plugin-sdk/src/schema/console-extensions';
import { Extension, EncodedCodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { parseJSONC } from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import { guessModuleFilePath } from '@console/dynamic-plugin-sdk/src/validation/ExtensionValidator';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import { validateConsoleExtensionsFileSchema } from '@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin';
import { trimStartMultiLine } from '../utils/string';
import { consolePkgScope, PluginPackage } from './plugin-resolver';

export const getExtensionsFilePath = (pkg: PluginPackage) =>
  path.resolve(pkg._path, extensionsFile);

export type LocalPluginsModuleData = {
  /** Generated module source code. */
  code: string;
  /** Diagnostics collected while generating module source code. */
  diagnostics: { errors: string[]; warnings: string[] };
  /** Absolute file paths representing webpack file dependencies of the generated module. */
  fileDependencies: string[];
};

const getExposedModuleFilePath = (
  pkg: PluginPackage,
  moduleName: string,
  diagnostics: LocalPluginsModuleData['diagnostics'],
) => {
  const modulePath = path.resolve(pkg._path, pkg.consolePlugin.exposedModules[moduleName]);
  return guessModuleFilePath(modulePath, (msg) =>
    diagnostics.warnings.push(`[${pkg.name}] ${msg}`),
  );
};

/**
 * Generate the Console local plugins virtual module source.
 */
export const getLocalPluginsModule = (
  pluginPackages: PluginPackage[],
  moduleHook: () => string = _.constant(''),
  extensionHook: (pkg: PluginPackage) => string = _.constant('[]'),
) => {
  let output = `
    ${moduleHook()}
    const localPlugins = [];
  `;

  for (const pkg of pluginPackages) {
    output = `
      ${output}
      localPlugins.push({
        name: '${pkg.name}',
        version: '${pkg.version}',
        extensions: ${extensionHook(pkg)},
        registrationMethod: 'local',
      });
    `;
  }

  output = `
    ${output}
    export default localPlugins;
  `;

  return trimStartMultiLine(output);
};

/**
 * Important: keep this in sync with `getLocalPluginsModule` above.
 */
export const loadLocalPluginsForTestPurposes = (
  pluginPackages: PluginPackage[],
  moduleHook: VoidFunction = _.noop,
  extensionHook: (pkg: PluginPackage) => Extension[] = _.constant([]),
) => {
  moduleHook();
  const localPlugins: LocalPluginManifest[] = [];

  for (const pkg of pluginPackages) {
    localPlugins.push({
      name: pkg.name,
      version: pkg.version,
      extensions: extensionHook(pkg),
      registrationMethod: 'local',
    });
  }

  return localPlugins;
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
  codeRefSourceGetter: typeof getExecutableCodeRefSource = getExecutableCodeRefSource,
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
        ? `@${codeRefTransformer(codeRefSourceGetter(value, key, pkg, codeRefValidationResult))}@`
        : value,
    2,
  ).replace(/"@(.*)@"/g, '$1');

  if (codeRefValidationResult.hasErrors()) {
    errorCallback(codeRefValidationResult.formatErrors());
    return emptyArraySource;
  }

  return trimStartMultiLine(source);
};

/**
 * Get Console local plugins virtual module data and diagnostics.
 */
export const getLocalPluginsModuleData = (
  pluginPackages: PluginPackage[],
): LocalPluginsModuleData => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileDependencies: string[] = [];

  const code = getLocalPluginsModule(
    pluginPackages,
    () => `
      import { applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
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
