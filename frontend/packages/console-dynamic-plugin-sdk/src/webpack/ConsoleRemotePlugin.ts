import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import * as webpack from 'webpack';
import { remoteEntryFile } from '../constants';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { sharedPluginModules } from '../shared-modules';
import { SchemaValidator } from '../validation/SchemaValidator';
import { loadSchema, ConsoleAssetPlugin } from './ConsoleAssetPlugin';

export const validatePackageFileSchema = (
  pkg: ConsolePackageJSON,
  description = 'package.json',
) => {
  const schema = loadSchema('plugin-package.json');
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

/**
 * Generates Console dynamic plugin remote container and related assets.
 *
 * All modules shared between the Console application and its dynamic plugins are treated as singletons.
 * Plugins won't bring their own fallback version of shared modules; Console is responsible for providing
 * all shared modules to all of its plugins.
 *
 * If you're facing issues related to `ExtensionValidator`, pass `CONSOLE_PLUGIN_SKIP_EXT_VALIDATOR=true`
 * env. variable to your webpack command.
 */
export class ConsoleRemotePlugin {
  private readonly pkg: ConsolePackageJSON;

  constructor() {
    this.pkg = readPkg.sync({ normalize: false }) as ConsolePackageJSON;
    validatePackageFileSchema(this.pkg).report();
  }

  apply(compiler: webpack.Compiler) {
    const logger = compiler.getInfrastructureLogger(ConsoleRemotePlugin.name);
    const publicPath = `/api/plugins/${this.pkg.consolePlugin.name}/`;
    const containerName = this.pkg.consolePlugin.name;
    const remoteEntryCallback = 'window.loadPluginEntry';

    // Validate webpack options
    if (compiler.options.output.publicPath !== undefined) {
      logger.warn(`output.publicPath is defined, but will be overridden to ${publicPath}`);
    }
    if (compiler.options.output.uniqueName !== undefined) {
      logger.warn(`output.uniqueName is defined, but will be overridden to ${containerName}`);
    }

    compiler.options.output.publicPath = publicPath;
    compiler.options.output.uniqueName = containerName;

    // Generate webpack federated module container assets
    new webpack.container.ModuleFederationPlugin({
      name: containerName,
      library: {
        type: 'jsonp',
        name: remoteEntryCallback,
      },
      filename: remoteEntryFile,
      exposes: _.mapValues(
        this.pkg.consolePlugin.exposedModules || {},
        (moduleRequest, moduleName) => ({
          import: moduleRequest,
          name: `exposed-${moduleName}`,
        }),
      ),
      shared: sharedPluginModules.reduce(
        (acc, moduleRequest) => ({
          ...acc,
          // https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
          [moduleRequest]: {
            // Allow only a single version of the shared module at runtime
            singleton: true,
            // Prevent plugins from using a fallback version of the shared module
            import: false,
          },
        }),
        {},
      ),
    }).apply(compiler);

    // Generate and/or post-process Console plugin assets
    new ConsoleAssetPlugin(
      this.pkg,
      remoteEntryCallback,
      process.env.CONSOLE_PLUGIN_SKIP_EXT_VALIDATOR === 'true',
    ).apply(compiler);
  }
}
