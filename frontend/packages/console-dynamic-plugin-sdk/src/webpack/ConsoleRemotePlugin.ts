import * as webpack from 'webpack';
import { ReplaceSource } from 'webpack-sources';
import * as readPkg from 'read-pkg';
import * as semver from 'semver';
import * as _ from 'lodash';
import { ConsoleAssetPlugin } from './ConsoleAssetPlugin';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { sharedVendorModules } from '../shared-modules';
import { SchemaValidator } from '../validation/SchemaValidator';
import { remoteEntryFile } from '../constants';
import consolePkgMetadataSchema from '../../dist/schema/plugin-package';

const remoteEntryLibraryType = 'jsonp';
const remoteEntryCallback = 'window.loadPluginEntry';

const validatePackageFile = (pkg: ConsolePackageJSON) => {
  const validator = new SchemaValidator('package.json');
  validator.result.assertThat(!!semver.valid(pkg.version), 'version must be semver compliant');

  if (pkg.consolePlugin) {
    validator.validate(consolePkgMetadataSchema, pkg.consolePlugin, 'consolePlugin');

    if (_.isPlainObject(pkg.consolePlugin.dependencies)) {
      Object.entries(pkg.consolePlugin.dependencies).forEach(([pluginName, versionRange]) => {
        validator.result.assertThat(
          !!semver.validRange(versionRange),
          `consolePlugin.dependencies['${pluginName}'] version range is not valid`,
        );
      });
    }
  } else {
    validator.result.addError('consolePlugin object is missing');
  }

  return validator.result;
};

export class ConsoleRemotePlugin {
  private readonly pkg: ConsolePackageJSON;

  constructor() {
    this.pkg = readPkg.sync({ normalize: false }) as ConsolePackageJSON;
    validatePackageFile(this.pkg).report();
  }

  apply(compiler: webpack.Compiler) {
    if (!compiler.options.output.enabledLibraryTypes.includes(remoteEntryLibraryType)) {
      compiler.options.output.enabledLibraryTypes.push(remoteEntryLibraryType);
    }

    // Apply relevant webpack plugins
    compiler.hooks.afterPlugins.tap(ConsoleRemotePlugin.name, () => {
      new webpack.container.ContainerPlugin({
        name: this.pkg.name,
        library: { type: remoteEntryLibraryType, name: remoteEntryCallback },
        filename: remoteEntryFile,
        exposes: this.pkg.consolePlugin.exposedModules || {},
        overridables: sharedVendorModules,
      }).apply(compiler);
      new ConsoleAssetPlugin(this.pkg).apply(compiler);
    });

    // Post-process generated remote entry source
    compiler.hooks.emit.tap(ConsoleRemotePlugin.name, (compilation) => {
      compilation.updateAsset(remoteEntryFile, (source) => {
        const newSource = new ReplaceSource(source);
        newSource.insert(
          remoteEntryCallback.length + 1,
          `'${this.pkg.name}@${this.pkg.version}', `,
        );
        return newSource;
      });
    });

    // Skip processing config.entry option if it's missing or empty
    if (_.isPlainObject(compiler.options.entry) && _.isEmpty(compiler.options.entry)) {
      compiler.hooks.entryOption.tap(ConsoleRemotePlugin.name, () => {
        return true;
      });
    }
  }
}
