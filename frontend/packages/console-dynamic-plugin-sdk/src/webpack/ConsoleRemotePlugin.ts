import * as path from 'path';
import {
  DynamicRemotePlugin,
  EncodedExtension,
  WebpackSharedConfig,
  WebpackSharedObject,
} from '@openshift/dynamic-plugin-sdk-webpack';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import * as semver from 'semver';
import * as webpack from 'webpack';
import { ConsolePluginBuildMetadata } from '../build-types';
import { extensionsFile } from '../constants';
import { sharedPluginModules, getSharedModuleMetadata } from '../shared-modules';
import { DynamicModuleMap, getDynamicModuleMap } from '../utils/dynamic-module-parser';
import { parseJSONC } from '../utils/jsonc';
import { loadSchema } from '../utils/schema';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import { SchemaValidator } from '../validation/SchemaValidator';
import { ValidationResult } from '../validation/ValidationResult';
import { DynamicModuleImportLoaderOptions } from './loaders/dynamic-module-import-loader';

type ConsolePluginPackageJSON = readPkg.PackageJson & {
  consolePlugin?: ConsolePluginBuildMetadata;
};

const dynamicModuleImportLoader =
  '@openshift-console/dynamic-plugin-sdk-webpack/lib/webpack/loaders/dynamic-module-import-loader';

const loadPluginPackageJSON = () => readPkg.sync({ normalize: false }) as ConsolePluginPackageJSON;

const loadVendorPackageJSON = (moduleName: string) =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`${moduleName}/package.json`) as readPkg.PackageJson;

const getVendorPackageVersion = (moduleName: string) => {
  try {
    return loadVendorPackageJSON(moduleName).version;
  } catch (e) {
    return undefined;
  }
};

const getPackageDependencies = (pkg: readPkg.PackageJson) => ({
  ...pkg.devDependencies,
  ...pkg.dependencies,
});

const getPatternFlyStyles = (baseDir: string) =>
  glob.sync(`${baseDir}/node_modules/@patternfly/react-styles/**/*.css`);

// https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
const getWebpackSharedModules = () =>
  sharedPluginModules.reduce<WebpackSharedObject>((acc, moduleName) => {
    const { singleton, allowFallback } = getSharedModuleMetadata(moduleName);
    const moduleConfig: WebpackSharedConfig = { singleton };

    if (!allowFallback) {
      moduleConfig.import = false;
    }

    acc[moduleName] = moduleConfig;
    return acc;
  }, {});

const getWebpackSharedDynamicModules = (
  pkg: ConsolePluginPackageJSON,
  moduleName: string,
  moduleRequests: string[],
) => {
  const pluginDeps = getPackageDependencies(pkg);
  const moduleVersion = getVendorPackageVersion(moduleName);
  const moduleVersionRange = pluginDeps[moduleName];
  const moduleConfig: WebpackSharedConfig = {};

  if (semver.valid(moduleVersion)) {
    moduleConfig.version = moduleVersion;
  }

  if (semver.validRange(moduleVersionRange)) {
    moduleConfig.requiredVersion = moduleVersionRange;
  }

  return moduleRequests.reduce<WebpackSharedObject>((acc, request) => {
    acc[`${moduleName}/${request}`] = moduleConfig;
    return acc;
  }, {});
};

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

const validateConsoleProvidedSharedModules = (pkg: ConsolePluginPackageJSON) => {
  const sdkPkg = loadVendorPackageJSON('@openshift-console/dynamic-plugin-sdk');
  const pluginDeps = getPackageDependencies(pkg);
  const result = new ValidationResult('package.json');

  sharedPluginModules.forEach((moduleName) => {
    const { allowFallback } = getSharedModuleMetadata(moduleName);

    // Skip modules that allow a fallback version to be provided by the plugin.
    // Also skip modules which are not explicitly listed in the plugin's dependencies.
    if (allowFallback || !pluginDeps[moduleName]) {
      return;
    }

    const providedVersionRange = sdkPkg.dependencies[moduleName];
    const consumedVersion = getVendorPackageVersion(moduleName);

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

  /**
   * Some vendor packages may support dynamic modules to be used with webpack module federation.
   *
   * If a module request matches the `transformImports` filter, that module will have its imports
   * transformed so that any _index_ imports for given vendor packages become imports for specific
   * dynamic modules of these vendor packages.
   *
   * For example, the following import:
   * ```ts
   * import { Alert, AlertProps, Wizard } from '@patternfly/react-core';
   * ```
   * will be transformed into:
   * ```ts
   * import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
   * import { AlertProps } from '@patternfly/react-core/dist/dynamic/components/Alert';
   * import { Wizard } from '@patternfly/react-core/dist/dynamic/components/Wizard';
   * ```
   *
   * Each dynamic module (such as `@patternfly/react-core/dist/dynamic/components/Alert`) will
   * be treated as a separate shared module at runtime. This approach allows for more efficient
   * federation of vendor package code, as opposed to sharing the whole vendor package index
   * (such as `@patternfly/react-core`) that pulls in all of its code.
   */
  sharedDynamicModuleSettings: Partial<{
    /**
     * Attempt to parse dynamic modules for these packages.
     *
     * Each package listed here should include a `dist/dynamic` directory containing `package.json`
     * files that refer to specific modules of that package.
     *
     * If not specified, the following packages will be included:
     * - `@patternfly/react-core`
     * - `@patternfly/react-icons`
     */
    packageSpecs: Record<
      string,
      Partial<{
        /** @default 'dist/esm/index.js' */
        indexModule: string;

        /** @default 'module' */
        resolutionField: string;
      }>
    >;

    /**
     * Import transformations will be applied to modules that match this filter.
     *
     * If not specified, the following conditions must be all true for a module to be matched:
     * - request ends with one of `.js`, `.jsx`, `.ts`, `.tsx`
     * - request does not contain `node_modules` path elements (i.e. not a vendor module request),
     *   _except_ for `@openshift-console/*` packages
     */
    transformImports: (moduleRequest: string) => boolean;
  }>;
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

  private readonly baseDir = process.cwd();

  private readonly pkg = loadPluginPackageJSON();

  private readonly sharedDynamicModuleMaps: Record<string, DynamicModuleMap>;

  constructor(options: ConsoleRemotePluginOptions = {}) {
    this.adaptedOptions = {
      pluginMetadata: options.pluginMetadata ?? this.pkg.consolePlugin,
      extensions: options.extensions ?? parseJSONC(path.resolve(this.baseDir, extensionsFile)),
      validateExtensionSchema: options.validateExtensionSchema ?? true,
      validateExtensionIntegrity: options.validateExtensionIntegrity ?? true,
      validateSharedModules: options.validateSharedModules ?? true,
      sharedDynamicModuleSettings: options.sharedDynamicModuleSettings ?? {},
    };

    if (this.adaptedOptions.validateExtensionSchema) {
      validateConsoleExtensionsFileSchema(this.adaptedOptions.extensions).report();
    }

    if (this.adaptedOptions.validateSharedModules) {
      validateConsoleProvidedSharedModules(this.pkg).report();
    }

    this.sharedDynamicModuleMaps = Object.entries(
      this.adaptedOptions.sharedDynamicModuleSettings.packageSpecs ?? {
        '@patternfly/react-core': {},
        '@patternfly/react-icons': {},
      },
    ).reduce<Record<string, DynamicModuleMap>>(
      (acc, [pkgName, { indexModule = 'dist/esm/index.js', resolutionField = 'module' }]) => ({
        ...acc,
        [pkgName]: getDynamicModuleMap(
          path.resolve(this.baseDir, 'node_modules', pkgName),
          indexModule,
          resolutionField,
        ),
      }),
      {},
    );
  }

  apply(compiler: webpack.Compiler) {
    const {
      pluginMetadata,
      extensions,
      validateExtensionIntegrity,
      sharedDynamicModuleSettings,
    } = this.adaptedOptions;

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

    compiler.options.resolve = compiler.options.resolve ?? {};
    compiler.options.resolve.alias = compiler.options.resolve.alias ?? {};

    // Prevent PatternFly styles from being included in the compilation
    getPatternFlyStyles(this.baseDir).forEach((cssFile) => {
      if (Array.isArray(compiler.options.resolve.alias)) {
        compiler.options.resolve.alias.push({ name: cssFile, alias: false });
      } else {
        compiler.options.resolve.alias[cssFile] = false;
      }
    });

    const allSharedDynamicModules = Object.entries(this.sharedDynamicModuleMaps).reduce<
      WebpackSharedObject
    >(
      (acc, [moduleName, dynamicModuleMap]) => ({
        ...acc,
        ...getWebpackSharedDynamicModules(this.pkg, moduleName, Object.values(dynamicModuleMap)),
      }),
      {},
    );

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
      sharedModules: {
        ...getWebpackSharedModules(),
        ...allSharedDynamicModules,
      },
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

    const transformImports =
      sharedDynamicModuleSettings.transformImports ??
      ((moduleRequest) => {
        const isCode = /\.(jsx?|tsx?)$/.test(moduleRequest);
        const isVendor = moduleRequest.includes('/node_modules/');

        return isCode && (!isVendor || moduleRequest.includes('/node_modules/@openshift-console/'));
      });

    compiler.hooks.thisCompilation.tap(ConsoleRemotePlugin.name, (compilation) => {
      const modifiedModules: string[] = [];

      webpack.NormalModule.getCompilationHooks(compilation).beforeLoaders.tap(
        ConsoleRemotePlugin.name,
        (loaders, normalModule) => {
          const { userRequest } = normalModule;

          const moduleRequest = userRequest.substring(
            userRequest.lastIndexOf('!') === -1 ? 0 : userRequest.lastIndexOf('!') + 1,
          );

          if (!modifiedModules.includes(moduleRequest) && transformImports(moduleRequest)) {
            const loaderOptions: DynamicModuleImportLoaderOptions = {
              dynamicModuleMaps: this.sharedDynamicModuleMaps,
              resourceMetadata: { jsx: /\.(jsx|tsx)$/.test(moduleRequest) },
            };

            normalModule.loaders.push({
              loader: dynamicModuleImportLoader,
              options: loaderOptions,
            } as any);

            modifiedModules.push(moduleRequest);
          }
        },
      );
    });
  }
}
