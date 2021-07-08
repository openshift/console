import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import * as webpack from 'webpack';
import { ReplaceSource } from 'webpack-sources';
import { remoteEntryFile } from '../constants';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { sharedVendorModules } from '../shared-modules';
import { SchemaValidator } from '../validation/SchemaValidator';
import { ConsoleAssetPlugin } from './ConsoleAssetPlugin';

export const validatePackageFileSchema = (
  pkg: ConsolePackageJSON,
  description = 'package.json',
) => {
  const schema = require('../../schema/plugin-package').default;
  const validator = new SchemaValidator(description);

  if (pkg.consolePlugin) {
    validator.validate(schema, pkg.consolePlugin, 'pkg.consolePlugin');

    validator.assert.validDNSSubdomainName(pkg.consolePlugin.name, 'pkg.consolePlugin.name');
    validator.assert.validSemverString(pkg.consolePlugin.version, 'pkg.consolePlugin.version');

    if (_.isPlainObject(pkg.consolePlugin.dependencies)) {
      Object.entries(pkg.consolePlugin.dependencies).forEach(([depName, versionRange]) => {
        validator.assert.validSemverRangeString(
          versionRange,
          `pkg.consolePlugin.dependencies['${depName}']`,
        );
      });
    }
  } else {
    validator.result.addError('pkg.consolePlugin object is missing');
  }

  return validator.result;
};

const remoteEntryLibraryType = 'jsonp';
const remoteEntryCallback = 'window.loadPluginEntry';

export class ConsoleRemotePlugin {
  private readonly pkg: ConsolePackageJSON;

  constructor() {
    this.pkg = readPkg.sync({ normalize: false }) as ConsolePackageJSON;
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
        library: { type: remoteEntryLibraryType, name: remoteEntryCallback },
        filename: remoteEntryFile,
        exposes: this.pkg.consolePlugin.exposedModules || {},
        overridables: sharedVendorModules,
      }).apply(compiler);
      new ConsoleAssetPlugin(this.pkg).apply(compiler);
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
