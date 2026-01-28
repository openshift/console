import * as path from 'path';
import type * as webpack from 'webpack';
import { getExtensionsFilePath } from '@console/plugin-sdk/src/codegen/local-plugins';
import { PluginPackage } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { ConsolePluginPackageJSON } from '../build-types';
import { ConsoleExtensionsJSON } from '../schema/console-extensions';
import { parseJSONC } from '../utils/jsonc';
import { ExtensionValidator } from '../validation/ExtensionValidator';

export type ExtensionValidatorPluginOptions = {
  /** List of plugin packages to validate */
  pluginPackages: PluginPackage[] | ConsolePluginPackageJSON[];
};

/**
 * Validate the integrity of the exposed modules and code references for the provided
 * plugin packages.
 */
export class ExtensionValidatorPlugin implements webpack.WebpackPluginInstance {
  constructor(private readonly options: ExtensionValidatorPluginOptions) {
    if (options.pluginPackages.length === 0) {
      throw new Error('List of plugin packages to validate must not be empty!');
    }
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tap(ExtensionValidatorPlugin.name, (compilation) => {
      this.options.pluginPackages.forEach((pkg) => {
        const result = new ExtensionValidator(pkg.name).validate(
          compilation,
          parseJSONC<ConsoleExtensionsJSON>(getExtensionsFilePath(pkg)),
          pkg.consolePlugin.exposedModules ?? {},
          path.dirname(getExtensionsFilePath(pkg)),
        );

        if (result.hasErrors()) {
          const error = new compiler.webpack.WebpackError(
            `ExtensionValidator has reported errors for plugin ${pkg.name}`,
          );
          error.details = result.formatErrors();
          error.file = getExtensionsFilePath(pkg);
          compilation.errors.push(error);
        }
      });
    });
  }
}
