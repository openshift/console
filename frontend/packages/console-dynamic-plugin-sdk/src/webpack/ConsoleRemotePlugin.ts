import * as path from 'path';
import { DynamicRemotePlugin, EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack';
import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import * as semver from 'semver';
import * as webpack from 'webpack';
import { ConsolePluginBuildMetadata } from '../build-types';
import { extensionsFile } from '../constants';
import { sharedPluginModules, getSharedModuleMetadata } from '../shared-modules';
import { parseJSONC } from '../utils/jsonc';
import { loadSchema } from '../utils/schema';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import { SchemaValidator } from '../validation/SchemaValidator';
import { ValidationResult } from '../validation/ValidationResult';

type ConsolePluginPackageJSON = readPkg.PackageJson & {
  consolePlugin?: ConsolePluginBuildMetadata;
};

const loadPluginPackageJSON = () => readPkg.sync({ normalize: false }) as ConsolePluginPackageJSON;

const loadVendorPackageJSON = (moduleName: string) =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`${moduleName}/package.json`) as readPkg.PackageJson;

// https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
const getWebpackSharedModules = () =>
  sharedPluginModules.reduce((acc, moduleName) => {
    const { singleton, allowFallback } = getSharedModuleMetadata(moduleName);
    const moduleConfig: Record<string, any> = { singleton };

    if (!allowFallback) {
      moduleConfig.import = false;
    }

    acc[moduleName] = moduleConfig;
    return acc;
  }, {});

/**
 * Perform (additional) build-time validation of Console plugin metadata.
 *
 * Note that `DynamicRemotePlugin` takes care of basic build metadata validation.
 * Therefore, this function only performs additional Console specific validations.
 */
const validateConsoleBuildMetadata = (metadata: ConsolePluginBuildMetadata) => {
  const result = new ValidationResult('Console plugin metadata');
  result.assertions.validDNSSubdomainName(metadata.name, 'metadata.name');
  return result;
};

export const validateConsoleExtensionsFileSchema = (
  extensions: EncodedExtension[],
  description = 'console-extensions.json',
) => {
  const schema = loadSchema('console-extensions.json');
  return new SchemaValidator(description).validate(schema, extensions);
};

const validateConsoleProvidedSharedModules = (
  pkg = loadPluginPackageJSON(),
  sdkPkg = loadVendorPackageJSON('@openshift-console/dynamic-plugin-sdk'),
) => {
  const pluginDeps = { ...pkg.devDependencies, ...pkg.dependencies };
  const result = new ValidationResult('package.json');

  sharedPluginModules.forEach((moduleName) => {
    const { allowFallback } = getSharedModuleMetadata(moduleName);

    // Skip modules that allow a fallback version to be provided by the plugin.
    // Also skip modules which are not explicitly listed in the plugin's dependencies.
    if (allowFallback || !pluginDeps[moduleName]) {
      return;
    }

    const providedVersionRange = sdkPkg.dependencies[moduleName];
    const consumedVersion = loadVendorPackageJSON(moduleName).version;

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
   * Console dynamic plugin metadata.
   *
   * If not specified, plugin metadata will be parsed from `consolePlugin` object within
   * the `package.json` file.
   *
   * Plugin metadata should meet the following requirements:
   *
   * - `name` should be the same as `metadata.name` of the corresponding `ConsolePlugin`
   *   resource on the cluster.
   * - `version` must be semver compliant.
   * - `dependencies` values must be valid semver ranges or `*` representing any version.
   *
   * Additional runtime environment specific dependencies available to Console plugins:
   *
   * - `@console/pluginAPI` - Console web application. This dependency is matched against
   *   the Console release version, as provided by the Console operator.
   */
  pluginMetadata: ConsolePluginBuildMetadata;

  /**
   * List of extensions contributed by the plugin.
   *
   * If not specified, extensions will be parsed from `console-extensions.json` file.
   */
  extensions: EncodedExtension[];

  /**
   * Validate extension objects using the `console-extensions.json` schema?
   *
   * @default true
   */
  validateExtensionSchema: boolean;

  /**
   * Validate integrity of extensions contributed by the plugin?
   *
   * This option controls whether to use `ExtensionValidator` to check the following criteria:
   * - each exposed module must have at least one code reference
   * - each code reference must point to a valid webpack module export
   *
   * @default true
   */
  validateExtensionIntegrity: boolean;

  /**
   * Validate Console provided shared module dependencies?
   *
   * Console provided shared modules can be reflected as `dependencies` within the manifest of
   * the `@openshift-console/dynamic-plugin-sdk` package. For each shared module where a fallback
   * version is not allowed, check that the version consumed by the plugin satisfies the expected
   * semver range as declared in the Console core SDK package manifest.
   *
   * @default true
   */
  validateSharedModules: boolean;
}>;

/**
 * Generates Console dynamic plugin remote container and related assets.
 *
 * Refer to `frontend/packages/console-dynamic-plugin-sdk/src/shared-modules.ts` for details on
 * Console application vs. dynamic plugins shared module configuration.
 *
 * @see {@link sharedPluginModules}
 * @see {@link getSharedModuleMetadata}
 */
export class ConsoleRemotePlugin implements webpack.WebpackPluginInstance {
  private readonly adaptedOptions: Required<ConsoleRemotePluginOptions>;

  constructor(options: ConsoleRemotePluginOptions = {}) {
    this.adaptedOptions = {
      pluginMetadata: options.pluginMetadata ?? loadPluginPackageJSON().consolePlugin,
      extensions: options.extensions ?? parseJSONC(path.resolve(process.cwd(), extensionsFile)),
      validateExtensionSchema: options.validateExtensionSchema ?? true,
      validateExtensionIntegrity: options.validateExtensionIntegrity ?? true,
      validateSharedModules: options.validateSharedModules ?? true,
    };

    if (this.adaptedOptions.validateExtensionSchema) {
      validateConsoleExtensionsFileSchema(this.adaptedOptions.extensions).report();
    }

    if (this.adaptedOptions.validateSharedModules) {
      validateConsoleProvidedSharedModules().report();
    }
  }

  apply(compiler: webpack.Compiler) {
    const { pluginMetadata, extensions, validateExtensionIntegrity } = this.adaptedOptions;

    const {
      name,
      version,
      dependencies,
      customProperties,
      exposedModules,
      displayName,
      description,
      disableStaticPlugins,
    } = pluginMetadata;

    const logger = compiler.getInfrastructureLogger(ConsoleRemotePlugin.name);
    const publicPath = `/api/plugins/${name}/`;

    if (compiler.options.output.publicPath !== undefined) {
      logger.warn(`output.publicPath is defined, but will be overridden to ${publicPath}`);
    }

    compiler.options.output.publicPath = publicPath;

    new DynamicRemotePlugin({
      pluginMetadata: {
        name,
        version,
        dependencies,
        customProperties: _.merge({}, customProperties, {
          console: { displayName, description, disableStaticPlugins },
        }),
        exposedModules,
      },
      extensions,
      sharedModules: getWebpackSharedModules(),
      entryCallbackSettings: {
        name: 'loadPluginEntry',
        pluginID: `${name}@${version}`,
      },
      entryScriptFilename:
        process.env.NODE_ENV === 'production'
          ? 'plugin-entry.[fullhash].min.js'
          : 'plugin-entry.js',
    }).apply(compiler);

    validateConsoleBuildMetadata(pluginMetadata).report();

    if (validateExtensionIntegrity) {
      compiler.hooks.emit.tap(ConsoleRemotePlugin.name, (compilation) => {
        const result = new ExtensionValidator('Console plugin extensions').validate(
          compilation,
          extensions,
          exposedModules ?? {},
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
