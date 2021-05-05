import * as path from 'path';
import * as _ from 'lodash';
import {
  isEncodedCodeRef,
  parseEncodedCodeRefValue,
} from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { ConsolePluginMetadata } from '@console/dynamic-plugin-sdk/src/schema/plugin-package';
import { validateExtensionsFileSchema } from '@console/dynamic-plugin-sdk/src/schema/schema-validations';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import { parseConsoleExtensions } from '@console/dynamic-plugin-sdk/src/extension-providers/provider-delegate';
import { EncodedCodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { Extension, ActivePlugin } from '../typings';
import { trimStartMultiLine } from '../utils/string';
import { consolePkgScope, PluginPackage } from './plugin-resolver';

/**
 * Generate the `@console/active-plugins` virtual module source.
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
  exposedModules: ConsolePluginMetadata['exposedModules'],
  validationResult: ValidationResult,
) => {
  const [moduleName, exportName] = parseEncodedCodeRefValue(ref.$codeRef);

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

  const importPath = `${pkg.name}/${path.normalize(exposedModules[moduleName])}`;
  const pluginReference = pkg.name.replace(`${consolePkgScope}/`, '');
  const webpackChunkName = `${pluginReference}/code-refs/${moduleName}`;
  const webpackMagicComment = `/* webpackChunkName: '${webpackChunkName}' */`;

  return `() => import('${importPath}' ${webpackMagicComment}).then((m) => m.${exportName})`;
};

/**
 * Returns the array source containing the given plugin's dynamic extensions.
 *
 * If an error occurs after parsing extensions, calls `errorCallback` and returns an empty array.
 * Errors due to parsing extensions are not handled, since these are supposed to block processing
 * of the given Console plugin.
 */
export const getDynamicExtensions = (
  pkg: PluginPackage,
  exposedModules: ConsolePluginMetadata['exposedModules'],
  errorCallback: (errorMessage: string) => void,
  codeRefTransformer: (codeRefSource: string) => string = _.identity,
) => {
  const { extensions, extensionsFilePath } = parseConsoleExtensions(pkg._path, exposedModules);
  const schemaValidationResult = validateExtensionsFileSchema(extensions, extensionsFilePath);

  if (schemaValidationResult.hasErrors()) {
    errorCallback(schemaValidationResult.formatErrors());
    return '[]';
  }

  const codeRefValidationResult = new ValidationResult(extensionsFilePath);
  const source = JSON.stringify(
    extensions,
    (key, value) =>
      isEncodedCodeRef(value)
        ? `@${codeRefTransformer(
            getExecutableCodeRefSource(value, key, pkg, exposedModules, codeRefValidationResult),
          )}@`
        : value,
    2,
  ).replace(/"@(.*)@"/g, '$1');

  if (codeRefValidationResult.hasErrors()) {
    errorCallback(codeRefValidationResult.formatErrors());
    return '[]';
  }

  return trimStartMultiLine(source);
};
