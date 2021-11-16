import * as fs from 'fs';
import * as path from 'path';
import * as findUp from 'find-up';
import * as webpack from 'webpack';
import { extensionsFile, pluginManifestFile, remoteEntryFile } from '../constants';
import { ConsoleExtensionsJSON } from '../schema/console-extensions';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { parseJSONC } from '../utils/jsonc';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import { SchemaValidator } from '../validation/SchemaValidator';

export const loadSchema = (relativePath: string) => {
  const pkgDir = path.dirname(findUp.sync('package.json', { cwd: __dirname }));

  const schemaPath = [
    path.resolve(pkgDir, 'schema'),
    path.resolve(pkgDir, 'generated/schema'),
  ].find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());

  return require(path.resolve(schemaPath, relativePath));
};

export const validateExtensionsFileSchema = (
  ext: ConsoleExtensionsJSON,
  description = extensionsFile,
) => {
  const schema = loadSchema('console-extensions.json');
  return new SchemaValidator(description).validate(schema, ext);
};

const getPluginManifest = (
  pkg: ConsolePackageJSON,
  ext: ConsoleExtensionsJSON,
): ConsolePluginManifestJSON => ({
  name: pkg.consolePlugin.name,
  version: pkg.consolePlugin.version,
  displayName: pkg.consolePlugin.displayName,
  description: pkg.consolePlugin.description,
  dependencies: pkg.consolePlugin.dependencies,
  disableStaticPlugins: pkg.consolePlugin.disableStaticPlugins,
  extensions: ext,
});

export class ConsoleAssetPlugin {
  private readonly ext: ConsoleExtensionsJSON;

  constructor(
    private readonly pkg: ConsolePackageJSON,
    private readonly remoteEntryCallback: string,
    private readonly skipExtensionValidator = false,
  ) {
    this.ext = parseJSONC<ConsoleExtensionsJSON>(path.resolve(process.cwd(), extensionsFile));
    validateExtensionsFileSchema(this.ext).report();
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(ConsoleAssetPlugin.name, (compilation) => {
      // Generate additional assets
      compilation.hooks.processAssets.tap(
        {
          name: ConsoleAssetPlugin.name,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          compilation.emitAsset(
            pluginManifestFile,
            new webpack.sources.RawSource(
              Buffer.from(JSON.stringify(getPluginManifest(this.pkg, this.ext), null, 2)),
            ),
          );
        },
      );

      // Post-process assets already present in the compilation
      compilation.hooks.processAssets.tap(
        {
          name: ConsoleAssetPlugin.name,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          compilation.updateAsset(remoteEntryFile, (source) => {
            const newSource = new webpack.sources.ReplaceSource(source);

            const fromIndex = source
              .source()
              .toString()
              .indexOf(`${this.remoteEntryCallback}(`);

            if (fromIndex < 0) {
              const error = new webpack.WebpackError(`Missing call to ${this.remoteEntryCallback}`);
              error.file = remoteEntryFile;
              compilation.errors.push(error);
            } else {
              newSource.insert(
                fromIndex + this.remoteEntryCallback.length + 1,
                `'${this.pkg.consolePlugin.name}@${this.pkg.consolePlugin.version}', `,
              );
            }

            return newSource;
          });
        },
      );
    });

    if (!this.skipExtensionValidator) {
      compiler.hooks.emit.tap(ConsoleAssetPlugin.name, (compilation) => {
        const result = new ExtensionValidator(extensionsFile).validate(
          compilation,
          this.ext,
          this.pkg.consolePlugin.exposedModules || {},
        );

        if (result.hasErrors()) {
          const error = new webpack.WebpackError('ExtensionValidator has reported errors');
          error.details = result.formatErrors();
          error.file = extensionsFile;
          compilation.errors.push(error);
        }
      });
    }
  }
}
