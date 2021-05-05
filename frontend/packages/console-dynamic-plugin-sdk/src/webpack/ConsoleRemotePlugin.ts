import * as webpack from 'webpack';
import { ReplaceSource } from 'webpack-sources';
import * as readPkg from 'read-pkg';
import * as _ from 'lodash';
import { ConsoleAssetPlugin } from './ConsoleAssetPlugin';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { validatePackageFileSchema } from '../schema/schema-validations';
import { sharedVendorModules } from '../shared-modules';
import { adaptExposedModulePaths } from '../utils/webpack';
import { remoteEntryFile } from '../constants';

const remoteEntryLibraryType = 'jsonp';
const remoteEntryCallback = 'window.loadPluginEntry';

export class ConsoleRemotePlugin {
  private readonly pkg: ConsolePackageJSON;

  private readonly pluginDir = process.cwd();

  constructor() {
    this.pkg = readPkg.sync({ cwd: this.pluginDir, normalize: false }) as ConsolePackageJSON;
    validatePackageFileSchema(this.pkg).report();
  }

  apply(compiler: webpack.Compiler) {
    if (!compiler.options.output.enabledLibraryTypes.includes(remoteEntryLibraryType)) {
      compiler.options.output.enabledLibraryTypes.push(remoteEntryLibraryType);
    }

    // Apply relevant webpack plugins
    compiler.hooks.afterPlugins.tap(ConsoleRemotePlugin.name, () => {
      new webpack.container.ContainerPlugin({
        name: this.pkg.consolePlugin.name,
        library: {
          type: remoteEntryLibraryType,
          name: remoteEntryCallback,
        },
        filename: remoteEntryFile,
        exposes: adaptExposedModulePaths(
          this.pkg.consolePlugin.exposedModules,
          this.pluginDir,
          compiler.context,
        ),
        overridables: sharedVendorModules,
      }).apply(compiler);
      new ConsoleAssetPlugin(this.pkg, this.pluginDir).apply(compiler);
    });

    // Post-process generated remote entry source
    // TODO(vojtech): fix 'webpack-sources' type incompatibility when updating to latest webpack 5
    compiler.hooks.emit.tap(ConsoleRemotePlugin.name, (compilation) => {
      compilation.updateAsset(remoteEntryFile, (source) => {
        const newSource = new ReplaceSource(source as any);
        newSource.insert(
          remoteEntryCallback.length + 1,
          `'${this.pkg.consolePlugin.name}@${this.pkg.consolePlugin.version}',`,
        );
        return newSource;
      });
    });

    // Skip processing entry option if it's missing or empty
    // TODO(vojtech): latest webpack 5 allows `entry: {}` so use that & remove following code
    if (_.isPlainObject(compiler.options.entry) && _.isEmpty(compiler.options.entry)) {
      compiler.hooks.entryOption.tap(ConsoleRemotePlugin.name, () => {
        return true;
      });
    }

    // Set default publicPath if output.publicPath option is missing or empty
    // TODO(vojtech): mainTemplate is deprecated in latest webpack 5, adapt code accordingly
    if (_.isEmpty(compiler.options.output.publicPath)) {
      compiler.hooks.thisCompilation.tap(ConsoleRemotePlugin.name, (compilation) => {
        compilation.mainTemplate.hooks.requireExtensions.tap(ConsoleRemotePlugin.name, () => {
          const pluginBaseURL = `/api/plugins/${this.pkg.consolePlugin.name}/`;
          return `${webpack.RuntimeGlobals.publicPath} = "${pluginBaseURL}";`;
        });
      });
    }
  }
}
