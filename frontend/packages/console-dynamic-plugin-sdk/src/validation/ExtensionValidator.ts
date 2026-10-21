import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import type { Compilation, NormalModule, Module } from 'webpack';
import type { ConsolePluginBuildMetadata } from '../build-types';
import { isEncodedCodeRef, parseEncodedCodeRefValue } from '../coderefs/coderef-resolver';
import type { Extension, EncodedCodeRef } from '../types';
import { deepForOwn } from '../utils/object';
import { BaseValidator } from './BaseValidator';

type ExtensionCodeRefData = {
  index: number;
  propToCodeRefValue: { [propName: string]: string };
};

/**
 * Guess the file path of the module (e.g., full path with extension,
 * or relevant barrel file) based on the given base path.
 *
 * Returns the base path if no relevant module file is found.
 *
 * @param basePath The base file path to start guessing from.
 * @param msgCallback Optional callback to log messages.
 */
export const guessModuleFilePath = (
  basePath: string,
  msgCallback: (msg: string) => void = _.noop,
) => {
  // Path already contains a file extension (no extra guessing needed)
  if (path.extname(basePath)) {
    return basePath;
  }

  // Check if the path refers to an barrel file (base path only specified the directory)
  const barrelFile = ['index.ts', 'index.js', 'index.tsx', 'index.jsx']
    .map((i) => path.resolve(basePath, i))
    .find(fs.existsSync);

  if (barrelFile) {
    msgCallback(
      `The module ${basePath} refers to an barrel file ${barrelFile}. Barrel files are not recommended as they may cause unnecessary code to be loaded. Consider specifying the module file path directly.`,
    );
    return barrelFile;
  }

  // Check if the base path neglected to include a file extension
  const moduleFile = ['.tsx', '.ts', '.jsx', '.js']
    .map((ext) => `${basePath}${ext}`)
    .find(fs.existsSync);

  if (moduleFile) {
    msgCallback(
      `The module ${basePath} refers to file ${moduleFile}, but a file extension was not specified.`,
    );
    return moduleFile;
  }

  // No relevant file could be found, return the original base path.
  return basePath;
};

export const collectCodeRefData = (extensions: Extension[]) =>
  extensions.reduce((acc, e, index) => {
    const data: ExtensionCodeRefData = { index, propToCodeRefValue: {} };

    deepForOwn<EncodedCodeRef>(e.properties, isEncodedCodeRef, (ref, key) => {
      data.propToCodeRefValue[key] = ref.$codeRef;
    });

    if (!_.isEmpty(data.propToCodeRefValue)) {
      acc.push(data);
    }

    return acc;
  }, [] as ExtensionCodeRefData[]);

export const findWebpackModules = (
  compilation: Compilation,
  exposedModules: ConsolePluginBuildMetadata['exposedModules'],
  pluginBasePath?: string,
) => {
  const webpackModules = Array.from(compilation.modules);
  return Object.keys(exposedModules).reduce((acc, moduleName) => {
    const absolutePath =
      pluginBasePath &&
      guessModuleFilePath(path.resolve(pluginBasePath, exposedModules[moduleName]));

    acc[moduleName] = webpackModules.find((m: NormalModule) => {
      // @ts-expect-error rootModule is internal to webpack's ModuleConcatenationPlugin
      const rootModule = m?.rootModule as NormalModule;

      /* first strategy: check if the module name matches the rawRequest */
      const rawRequest = m?.rawRequest || rootModule?.rawRequest;
      const matchesRawRequest = rawRequest && rawRequest === exposedModules[moduleName];

      /* second strategy: check if the absolute path matches the resource */
      const resource = m?.resource || rootModule?.resource;
      const matchesAbsolutePath = resource && resource === absolutePath;

      return matchesRawRequest || matchesAbsolutePath;
    });
    return acc;
  }, {} as { [moduleName: string]: Module });
};

export class ExtensionValidator extends BaseValidator {
  validate(
    compilation: Compilation,
    extensions: Extension[],
    exposedModules: ConsolePluginBuildMetadata['exposedModules'],
    pluginBasePath?: string,
  ) {
    const codeRefs = collectCodeRefData(extensions);
    const webpackModules = findWebpackModules(compilation, exposedModules, pluginBasePath);

    // Each exposed module must have at least one code reference
    Object.keys(exposedModules).forEach((moduleName) => {
      const moduleReferenced = codeRefs.some((data) =>
        Object.values(data.propToCodeRefValue).some((value) => {
          const [parsedModuleName] = parseEncodedCodeRefValue(value);
          return parsedModuleName && moduleName === parsedModuleName;
        }),
      );

      if (!moduleReferenced) {
        this.result.addError(`Exposed module '${moduleName}' is not referenced by any extension`);
      }
    });

    // Each code reference must point to a valid webpack module export
    codeRefs.forEach((data) => {
      Object.entries(data.propToCodeRefValue).forEach(([propName, codeRefValue]) => {
        const [moduleName, exportName] = parseEncodedCodeRefValue(codeRefValue);
        const errorTrace = `in extension [${data.index}] property '${propName}'`;

        if (!moduleName || !exportName) {
          this.result.addError(`Invalid code reference '${codeRefValue}' ${errorTrace}`);
          return;
        }

        const foundModule = webpackModules[moduleName];

        if (!foundModule) {
          this.result.addError(`Invalid module '${moduleName}' ${errorTrace}`);
          return;
        }

        const moduleExports = compilation.moduleGraph.getProvidedExports(foundModule);
        const exportValid = Array.isArray(moduleExports) && moduleExports.includes(exportName);

        if (!exportValid) {
          this.result.addError(`Invalid module export '${exportName}' ${errorTrace}`);
        }
      });
    });

    return this.result;
  }
}
