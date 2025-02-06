import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as webpack from 'webpack';
import { ConsolePluginBuildMetadata } from '../build-types';
import { isEncodedCodeRef, parseEncodedCodeRefValue } from '../coderefs/coderef-resolver';
import { Extension, EncodedCodeRef } from '../types';
import { deepForOwn } from '../utils/object';
import { BaseValidator } from './BaseValidator';

type ExtensionCodeRefData = {
  index: number;
  propToCodeRefValue: { [propName: string]: string };
};

/**
 * Guess the file path of the module (e.g., the extension, any barrel file)
 * based on the given base path.
 *
 * Returns the base path if no file is found.
 *
 * @param basePath The base file path to start guessing from.
 * @param msgCallback Optional callback to log messages.
 */
export const guessModuleFilePath = (basePath: string, msgCallback?: (msg: string) => void) => {
  // Path already contains a file extension (no extra guessing needed)
  if (path.extname(basePath)) {
    return basePath;
  }

  // Check if the module is an index file (base path only specified the directory)
  const indexModulePaths = ['index.ts', 'index.js'].map((i) => path.resolve(basePath, i));

  for (const p of indexModulePaths) {
    if (fs.existsSync(p)) {
      // TODO(OCPBUGS-45847): uncomment when warnings are resolved
      // msgCallback && msgCallback(`The module ${basePath} refers to an barrel file ${p}. Barrel files are not recommended as they may cause unnecessary code to be loaded. Consider specifying the module file directly.`);
      return p;
    }
  }

  // Check if the base path neglected to include a file extension
  const extensions = ['.tsx', '.ts', '.jsx', '.js'];
  const pathsToCheck = [...extensions.map((ext) => `${basePath}${ext}`)];

  for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
      msgCallback &&
        msgCallback(
          `The module ${basePath} refers to a file ${p}, but a file extension was not specified.`,
        );
      return p;
    }
  }

  // A file couldn't be found, return the original module path.
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
  compilation: webpack.Compilation,
  exposedModules: ConsolePluginBuildMetadata['exposedModules'],
  basePath?: string,
) => {
  const webpackModules = Array.from(compilation.modules);
  return Object.keys(exposedModules).reduce((acc, moduleName) => {
    const absolutePath =
      basePath && guessModuleFilePath(path.resolve(basePath, exposedModules[moduleName]));

    acc[moduleName] = webpackModules.find((m) => {
      // first strategy: check if the module name matches the rawRequest
      const rawRequest: string = _.get(m, 'rawRequest') || _.get(m, 'rootModule.rawRequest');
      const matchesRawRequest = exposedModules[moduleName] === rawRequest;
      if (matchesRawRequest || !basePath) {
        return matchesRawRequest;
      }

      // second strategy: check if the absolute path matches the resource
      const absoluteRequest: string = _.get(m, 'resource') || _.get(m, 'rootModule.resource');
      return absoluteRequest === absolutePath;
    });
    return acc;
  }, {} as { [moduleName: string]: webpack.Module });
};

export class ExtensionValidator extends BaseValidator {
  validate(
    compilation: webpack.Compilation,
    extensions: Extension[],
    exposedModules: ConsolePluginBuildMetadata['exposedModules'],
    basePath?: string,
  ) {
    const codeRefs = collectCodeRefData(extensions);
    const webpackModules = findWebpackModules(compilation, exposedModules, basePath);

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
