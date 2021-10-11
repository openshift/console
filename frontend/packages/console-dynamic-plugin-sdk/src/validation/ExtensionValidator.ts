import * as _ from 'lodash';
import * as webpack from 'webpack';
import { isEncodedCodeRef, parseEncodedCodeRefValue } from '../coderefs/coderef-resolver';
import { ConsolePluginMetadata } from '../schema/plugin-package';
import { Extension, EncodedCodeRef } from '../types';
import { deepForOwn } from '../utils/object';
import { ValidationResult } from './ValidationResult';

type ExtensionCodeRefData = {
  index: number;
  propToCodeRefValue: { [propName: string]: string };
};

type ExposedPluginModules = ConsolePluginMetadata['exposedModules'];

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
  exposedModules: ExposedPluginModules,
) => {
  const webpackModules = Array.from(compilation.modules);

  return Object.keys(exposedModules).reduce((acc, moduleName) => {
    acc[moduleName] = webpackModules.find((m) => {
      const rawRequest = _.get(m, 'rawRequest') || _.get(m, 'rootModule.rawRequest');
      return exposedModules[moduleName] === rawRequest;
    });
    return acc;
  }, {} as { [moduleName: string]: webpack.Module });
};

export class ExtensionValidator {
  readonly result: ValidationResult;

  constructor(description: string) {
    this.result = new ValidationResult(description);
  }

  validate(
    compilation: webpack.Compilation,
    extensions: Extension[],
    exposedModules: ExposedPluginModules,
    dataVar: string = 'extensions',
  ) {
    const codeRefs = collectCodeRefData(extensions);
    const webpackModules = findWebpackModules(compilation, exposedModules);

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
        const errorTrace = `in ${dataVar}[${data.index}] property '${propName}'`;

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
