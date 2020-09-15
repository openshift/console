import * as webpack from 'webpack';
import * as _ from 'lodash';
import { ValidationResult } from './ValidationResult';
import { ConsolePluginMetadata } from '../schema/plugin-package';
import { SupportedExtension } from '../schema/console-extensions';
import {
  filterEncodedCodeRefProperties,
  parseEncodedCodeRefValue,
} from '../coderefs/coderef-resolver';

type ExtensionCodeRefData = {
  index: number;
  propToCodeRefValue: { [propName: string]: string };
};

type ExposedPluginModules = ConsolePluginMetadata['exposedModules'];

const collectCodeRefData = (extensions: SupportedExtension[]) =>
  extensions.reduce((acc, e, index) => {
    const refs = filterEncodedCodeRefProperties(e.properties);
    if (!_.isEmpty(refs)) {
      acc.push({ index, propToCodeRefValue: _.mapValues(refs, (obj) => obj.$codeRef) });
    }
    return acc;
  }, [] as ExtensionCodeRefData[]);

const findWebpackModules = (
  compilation: webpack.Compilation,
  exposedModules: ExposedPluginModules,
) => {
  const webpackModules = Array.from(compilation.modules);
  return Object.keys(exposedModules).reduce((acc, moduleName) => {
    acc[moduleName] = webpackModules.find(
      (m) => (m as webpack.NormalModule)?.rawRequest === exposedModules[moduleName],
    );
    return acc;
  }, {} as { [moduleName: string]: webpack.Module });
};

export class ExtensionValidator {
  public readonly result: ValidationResult;

  constructor(description: string) {
    this.result = new ValidationResult(description);
  }

  validate(
    compilation: webpack.Compilation,
    extensions: SupportedExtension[],
    exposedModules: ExposedPluginModules,
    dataVar: string = 'obj',
    extensionDataVar: string = 'data',
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
        const errorTrace = `in ${dataVar}.${extensionDataVar}[${data.index}] property '${propName}'`;

        if (!moduleName) {
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
