import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import * as semver from 'semver';
import * as webpack from 'webpack';
import { remoteEntryFile } from '../constants';
import { ConsolePackageJSON } from '../schema/plugin-package';
import { sharedPluginModules, sharedPluginModulesMetadata } from '../shared-modules';
import { SchemaValidator } from '../validation/SchemaValidator';
import { ValidationResult } from '../validation/ValidationResult';
import { loadSchema, ConsoleAssetPlugin } from './ConsoleAssetPlugin';

const loadPackageManifest = (moduleName: string) =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`${moduleName}/package.json`) as readPkg.PackageJson;

const validatePackageFileSchema = (pkg: ConsolePackageJSON) => {
  const schema = loadSchema('plugin-package.json');
  const validator = new SchemaValidator('package.json');

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

const validateConsoleProvidedSharedModules = (
  pkg: ConsolePackageJSON,
  sdkPkg = loadPackageManifest('@openshift-console/dynamic-plugin-sdk'),
) => {
  const pluginDeps = { ...pkg.devDependencies, ...pkg.dependencies };
  const result = new ValidationResult('package.json');

  sharedPluginModules.forEach((moduleName) => {
    // Skip modules for which a fallback (different) version can be provided by the plugin.
    // Also skip modules which are not explicitly listed in the plugin's dependencies.
    if (sharedPluginModulesMetadata[moduleName].allowFallback || !pluginDeps[moduleName]) {
      return;
    }

    const providedVersionRange = sdkPkg.dependencies[moduleName];
    const consumedVersion = loadPackageManifest(moduleName).version;

    if (semver.validRange(providedVersionRange) && semver.valid(consumedVersion)) {
      result.assertThat(
        semver.satisfies(consumedVersion, providedVersionRange),
        `Console provides shared module ${moduleName} ${providedVersionRange} but plugin uses version ${consumedVersion}`,
      );
    }
  });

  return result;
};

export type ConsoleRemotePluginOptions = Partial<{
  /**
   * Validate the plugin's `package.json` file schema?
   *
   * This controls the validation of `consolePlugin` object within the plugin's package
   * manifest using the `plugin-package.json` schema. The `consolePlugin` object should
   * exist and contain valid Console dynamic plugin metadata.
   *
   * @default true
   */
  validatePackageSchema: boolean;

  /**
   * Validate Console provided shared modules which are consumed by the plugin?
   *
   * Console provided shared modules are reflected as `dependencies` in the core plugin
   * SDK package manifest. For each shared module where a fallback version is not allowed,
   * check that the version consumed by the plugin satisfies the expected semver range as
   * declared in the core plugin SDK package manifest.
   *
   * @default true
   */
  validateSharedModules: boolean;

  /**
   * Validate the plugin's `console-extensions.json` file schema?
   *
   * This controls the validation of extension declarations using the `console-extensions.json`
   * schema.
   *
   * @default true
   */
  validateExtensionSchema: boolean;

  /**
   * Validate the integrity of extensions declared in `console-extensions.json` file?
   *
   * This controls whether to use `ExtensionValidator` to check extension declarations:
   * - each exposed module must have at least one code reference
   * - each code reference must point to a valid webpack module export
   *
   * @default true
   */
  validateExtensionIntegrity: boolean;
}>;

/**
 * Generates Console dynamic plugin remote container and related assets.
 *
 * Default configuration for modules shared between the Console application and its dynamic plugins:
 * - shared modules are treated as singletons
 * - plugins won't bring their own fallback version of shared modules
 *
 * If you're facing `ExtensionValidator` related issues, set the `validateExtensionIntegrity` option
 * to `false` or pass `CONSOLE_PLUGIN_SKIP_EXT_VALIDATOR=true` env. variable to your webpack command.
 *
 * @see {@link sharedPluginModulesMetadata}
 */
export class ConsoleRemotePlugin {
  private readonly options: Required<ConsoleRemotePluginOptions>;

  private readonly pkg: ConsolePackageJSON;

  constructor(options: ConsoleRemotePluginOptions = {}) {
    this.pkg = readPkg.sync({ normalize: false }) as ConsolePackageJSON;

    this.options = {
      validatePackageSchema: options.validatePackageSchema ?? true,
      validateSharedModules: options.validateSharedModules ?? true,
      validateExtensionSchema: options.validateExtensionSchema ?? true,
      validateExtensionIntegrity: options.validateExtensionIntegrity ?? true,
    };

    if (this.options.validatePackageSchema) {
      validatePackageFileSchema(this.pkg).report();
    }

    if (this.options.validateSharedModules) {
      validateConsoleProvidedSharedModules(this.pkg).report();
    }
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

    const containerLibrary = {
      type: 'jsonp',
      name: remoteEntryCallback,
    };

    const containerModules = _.mapValues(
      this.pkg.consolePlugin.exposedModules || {},
      (moduleRequest, moduleName) => ({
        import: moduleRequest,
        name: `exposed-${moduleName}`,
      }),
    );

    // https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
    const sharedModules = Object.entries(sharedPluginModulesMetadata).reduce(
      (acc, [moduleRequest, moduleMetadata]) => {
        const adaptedMetadata = _.defaults({}, moduleMetadata, {
          singleton: true,
          allowFallback: false,
        });

        const moduleConfig: Record<string, any> = {
          singleton: adaptedMetadata.singleton,
        };

        if (!adaptedMetadata.allowFallback) {
          moduleConfig.import = false;
        }

        acc[moduleRequest] = moduleConfig;
        return acc;
      },
      {},
    );

    compiler.options.output.publicPath = publicPath;
    compiler.options.output.uniqueName = containerName;

    // Generate webpack federated module container assets
    new webpack.container.ModuleFederationPlugin({
      name: containerName,
      library: containerLibrary,
      filename: remoteEntryFile,
      exposes: containerModules,
      shared: sharedModules,
    }).apply(compiler);

    // ModuleFederationPlugin does not generate a container entry when the provided
    // exposes option is empty; we fix that by invoking the ContainerPlugin manually
    if (_.isEmpty(containerModules)) {
      new webpack.container.ContainerPlugin({
        name: containerName,
        library: containerLibrary,
        filename: remoteEntryFile,
        exposes: containerModules,
      }).apply(compiler);
    }

    // Generate and/or post-process Console plugin assets
    new ConsoleAssetPlugin(
      this.pkg,
      remoteEntryCallback,
      this.options.validateExtensionSchema,
      this.options.validateExtensionIntegrity &&
        process.env.CONSOLE_PLUGIN_SKIP_EXT_VALIDATOR !== 'true',
    ).apply(compiler);
  }
}
