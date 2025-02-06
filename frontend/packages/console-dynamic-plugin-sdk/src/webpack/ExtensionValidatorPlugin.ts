import { dirname } from 'path';
import { WebpackPluginInstance, Compiler, WebpackError } from 'webpack';
import { getExtensionsFilePath } from '@console/plugin-sdk/src/codegen/active-plugins';
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
 * Validate the integrity of the exposed modules and codeRefs for static
 * plugin packages.
 */
export class ExtensionValidatorPlugin implements WebpackPluginInstance {
  constructor(private readonly options: ExtensionValidatorPluginOptions) {}

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap(ExtensionValidatorPlugin.name, (compilation) => {
      this.options.pluginPackages.forEach((pkg) => {
        const result = new ExtensionValidator(pkg.name).validate(
          compilation,
          parseJSONC<ConsoleExtensionsJSON>(getExtensionsFilePath(pkg)),
          pkg.consolePlugin.exposedModules ?? {},
          dirname(getExtensionsFilePath(pkg)),
        );

        if (result.hasErrors()) {
          const error = new WebpackError(`ExtensionValidator has reported errors for ${pkg.name}`);
          error.details = result.formatErrors();
          error.file = getExtensionsFilePath(pkg);
          compilation.errors.push(error);
        }
      });
    });
  }
}
