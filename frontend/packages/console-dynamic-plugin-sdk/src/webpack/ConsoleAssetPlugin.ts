import * as webpack from 'webpack';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { validateExtensionsFileSchema } from '../schema/schema-validations';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import { parseConsoleExtensions } from '../extension-providers/provider-delegate';
import { adaptExposedModulePaths } from '../utils/webpack';
import { extensionsFile, pluginManifestFile } from '../constants';

const emitJSON = (compilation: webpack.Compilation, filename: string, data: any) => {
  const content = JSON.stringify(data, null, 2);

  // webpack compilation.emitAsset API requires the source argument to implement
  // methods which aren't strictly needed for processing the asset. In this case,
  // we just provide the content (source) and its length (size).

  // TODO(vojtech): revisit after bumping webpack 5 to latest stable version
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  compilation.emitAsset(filename, {
    source: () => content,
    size: () => content.length,
  });
};

export class ConsoleAssetPlugin {
  private readonly manifest: ConsolePluginManifestJSON;

  constructor(private readonly pkg: ConsolePackageJSON, private readonly pluginDir: string) {
    const exposedModules = adaptExposedModulePaths(pkg.consolePlugin.exposedModules, pluginDir);

    const { extensions, extensionsFilePath } = parseConsoleExtensions(pluginDir, exposedModules);
    validateExtensionsFileSchema(extensions, extensionsFilePath).report();

    this.manifest = {
      name: pkg.consolePlugin.name,
      version: pkg.consolePlugin.version,
      displayName: pkg.consolePlugin.displayName,
      description: pkg.consolePlugin.description,
      dependencies: pkg.consolePlugin.dependencies,
      extensions,
    };
  }

  apply(compiler: webpack.Compiler) {
    const errors: string[] = [];

    const validateExtensions = (compilation: webpack.Compilation) => {
      const result = new ExtensionValidator(extensionsFile).validate(
        compilation,
        this.manifest.extensions,
        adaptExposedModulePaths(
          this.pkg.consolePlugin.exposedModules,
          this.pluginDir,
          compiler.context,
        ),
      );

      if (result.hasErrors()) {
        errors.push(result.formatErrors());
      }
    };

    const addErrorsToCompilation = (compilation: webpack.Compilation) => {
      errors.forEach((e) => {
        // TODO(vojtech): revisit after bumping webpack 5 to latest stable version
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compilation.errors.push(new Error(e));
      });
    };

    compiler.hooks.afterCompile.tap(ConsoleAssetPlugin.name, validateExtensions);

    compiler.hooks.shouldEmit.tap(ConsoleAssetPlugin.name, (compilation) => {
      addErrorsToCompilation(compilation);
      return errors.length === 0;
    });

    compiler.hooks.emit.tap(ConsoleAssetPlugin.name, (compilation) => {
      emitJSON(compilation, pluginManifestFile, this.manifest);
    });
  }
}
