import * as path from 'path';
import * as webpack from 'webpack';
import { extensionsFile, pluginManifestFile } from '../constants';
import { ConsoleExtensionsJSON } from '../schema/console-extensions';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { parseJSONC } from '../utils/jsonc';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import { SchemaValidator } from '../validation/SchemaValidator';

export const validateExtensionsFileSchema = (
  ext: ConsoleExtensionsJSON,
  description = extensionsFile,
) => {
  const schema = require('../../schema/console-extensions').default;
  return new SchemaValidator(description).validate(schema, ext);
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
      name: pkg.consolePlugin.name,
      version: pkg.consolePlugin.version,
      displayName: pkg.consolePlugin.displayName,
      description: pkg.consolePlugin.description,
      dependencies: pkg.consolePlugin.dependencies,
      extensions: ext,
    };
  }

  apply(compiler: webpack.Compiler) {
    const errors: string[] = [];

    const addErrorsToCompilation = (compilation: webpack.Compilation) => {
      errors.forEach((e) => {
        // TODO(vojtech): revisit after bumping webpack 5 to latest stable version
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compilation.errors.push(new Error(e));
      });
    };

    compiler.hooks.afterCompile.tap(ConsoleAssetPlugin.name, (compilation) => {
      const result = new ExtensionValidator(extensionsFile).validate(
        compilation,
        this.manifest.extensions,
        this.pkg.consolePlugin.exposedModules || {},
      );

      if (result.hasErrors()) {
        errors.push(result.formatErrors());
      }
    });

    compiler.hooks.shouldEmit.tap(ConsoleAssetPlugin.name, (compilation) => {
      addErrorsToCompilation(compilation);
      return errors.length === 0;
    });

    compiler.hooks.emit.tap(ConsoleAssetPlugin.name, (compilation) => {
      emitJSON(compilation, pluginManifestFile, this.manifest);
    });
  }
}
