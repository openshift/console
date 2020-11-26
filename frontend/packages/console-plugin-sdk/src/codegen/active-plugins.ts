import * as fs from 'fs';
import * as _ from 'lodash';
import {
  isEncodedCodeRef,
  parseEncodedCodeRefValue,
} from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { ConsoleExtensionsJSON } from '@console/dynamic-plugin-sdk/src/schema/console-extensions';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import { EncodedCodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { parseJSONC } from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import { validateExtensionsFileSchema } from '@console/dynamic-plugin-sdk/src/webpack/ConsoleAssetPlugin';
import { Extension, ActivePlugin } from '../typings';
import { trimStartMultiLine } from '../utils/string';
import { consolePkgScope, PluginPackage } from './plugin-resolver';

/**
 * Reload the requested module, bypassing `require.cache` mechanism.
 */
export const reloadModule = (request: string) => {
  delete require.cache[require.resolve(request)];
  return require(request);
};

/**
 * Generate the `@console/active-plugins` virtual module source.
 */
export const getActivePluginsModule = (
  pluginPackages: PluginPackage[],
  dynamicExtensionHook: (pkg: PluginPackage) => string = _.constant('[]'),
) => {
  let output = `
    const activePlugins = [];
  `;

  for (const pkg of pluginPackages) {
    output = `
      ${output}
      activePlugins.push({
        name: '${pkg.name}',
        extensions: [
          ...require('${pkg.name}/${pkg.consolePlugin.entry}').default,
          ...${dynamicExtensionHook(pkg)},
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
  dynamicExtensionHook: (pkg: PluginPackage) => Extension[] = _.constant([]),
) => {
  const activePlugins: ActivePlugin[] = [];

  for (const pkg of pluginPackages) {
    activePlugins.push({
      name: pkg.name,
      extensions: [
        ...require(`${pkg.name}/${pkg.consolePlugin.entry}`).default,
        ...dynamicExtensionHook(pkg),
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
  let requestedModule: object;

  try {
    requestedModule = reloadModule(importPath);
  } catch (error) {
    validationResult.addError(`Cannot import '${importPath}' ${errorTrace}`);
    return emptyCodeRefSource;
  }

  if (!requestedModule[exportName]) {
    validationResult.addError(`Invalid module export '${exportName}' ${errorTrace}`);
    return emptyCodeRefSource;
  }

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
) => {
  const emptyArraySource = '[]';

  if (!fs.existsSync(extensionsFilePath)) {
    return emptyArraySource;
  }

  const ext = parseJSONC<ConsoleExtensionsJSON>(extensionsFilePath);
  const schemaValidationResult = validateExtensionsFileSchema(ext, extensionsFilePath);

  if (schemaValidationResult.hasErrors()) {
    errorCallback(schemaValidationResult.formatErrors());
    return emptyArraySource;
  }

  const codeRefValidationResult = new ValidationResult(extensionsFilePath);
  const source = JSON.stringify(
    ext.data,
    (key, value) =>
      isEncodedCodeRef(value)
        ? `%${getExecutableCodeRefSource(value, key, pkg, codeRefValidationResult)}%`
        : value,
    2,
  ).replace(/"%(.*)%"/g, '$1');

  if (codeRefValidationResult.hasErrors()) {
    errorCallback(codeRefValidationResult.formatErrors());
    return emptyArraySource;
  }

  return trimStartMultiLine(source);
};
