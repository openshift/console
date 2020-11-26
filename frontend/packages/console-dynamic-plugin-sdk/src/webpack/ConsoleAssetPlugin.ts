import * as webpack from 'webpack';
import * as path from 'path';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { ConsoleExtensionsJSON } from '../schema/console-extensions';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { SchemaValidator } from '../validation/SchemaValidator';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import consoleExtensionsSchema from '../../dist/schema/console-extensions';
import { extensionsFile, pluginManifestFile } from '../constants';
import { parseJSONC } from '../utils/jsonc';

export const validateExtensionsFileSchema = (
  ext: ConsoleExtensionsJSON,
  description = extensionsFile,
) => {
  return new SchemaValidator(description).validate(consoleExtensionsSchema, ext);
};

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

  constructor(private readonly pkg: ConsolePackageJSON) {
    const ext = parseJSONC<ConsoleExtensionsJSON>(path.resolve(process.cwd(), extensionsFile));
    validateExtensionsFileSchema(ext).report();

    this.manifest = {
      name: pkg.name,
      version: pkg.version,
      displayName: pkg.consolePlugin.displayName,
      description: pkg.consolePlugin.description,
      dependencies: pkg.consolePlugin.dependencies,
      extensions: ext.data,
    };
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.shouldEmit.tap(ConsoleAssetPlugin.name, (compilation) => {
      const result = new ExtensionValidator(extensionsFile).validate(
        compilation,
        this.manifest.extensions,
        this.pkg.consolePlugin.exposedModules || {},
      );

      if (result.hasErrors()) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compilation.errors.push(new Error(result.formatErrors()));
      }

      return result.hasErrors();
    });

    compiler.hooks.emit.tap(ConsoleAssetPlugin.name, (compilation) => {
      emitJSON(compilation, pluginManifestFile, this.manifest);
    });
  }
}
