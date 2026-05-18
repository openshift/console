import * as path from 'path';
import type {
  EncodedExtension,
  WebpackSharedConfig,
  WebpackSharedObject,
} from '@openshift/dynamic-plugin-sdk-webpack';
import { DynamicRemotePlugin } from '@openshift/dynamic-plugin-sdk-webpack';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import * as semver from 'semver';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import type { ConsolePluginBuildMetadata, ConsolePluginPackageJSON } from '../build-types';
import { extensionsFile, REMOTE_ENTRY_CALLBACK } from '../constants';
import {
  sharedPluginModules,
  getSharedModuleMetadata,
} from '../shared-modules/shared-modules-meta';
import type { DynamicModuleMap } from '../utils/dynamic-module-parser';
import { parseJSONC } from '../utils/jsonc';
import { loadSchema } from '../utils/schema';
import { ExtensionValidator } from '../validation/ExtensionValidator';
import { SchemaValidator } from '../validation/SchemaValidator';
import { ValidationResult } from '../validation/ValidationResult';
import type { DynamicModulePackageSpecs } from './DynamicModuleImportPlugin';
import { DynamicModuleImportPlugin, resolveDynamicModuleMaps } from './DynamicModuleImportPlugin';

const loadPluginPackageJSON = () => readPkg.sync({ normalize: false }) as ConsolePluginPackageJSON;

const loadVendorPackageJSON = (moduleName: string) =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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

const hasPackageDependency = (pkg: readPkg.PackageJson, depName: string) =>
  Object.keys(getPackageDependencies(pkg)).includes(depName);

const getPluginSDKPackagePeerDependencies = () =>
  loadVendorPackageJSON('@openshift-console/dynamic-plugin-sdk').peerDependencies;

const getPatternFlyStyles = (baseDir: string) =>
  glob.sync(`${baseDir}/node_modules/@patternfly/react-styles/**/*.css`);

/**
 * Get webpack shared module configuration to use by Console plugins.
 *
 * This includes Console provided {@link sharedPluginModules} and shared dynamic modules
 * resolved from {@link dynamicModulePackageSpecs}.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
const getWebpackSharedModules = (
  pkg: ConsolePluginPackageJSON,
  dynamicModuleMaps: Record<string, DynamicModuleMap>,
): WebpackSharedObject => {
  const sdkPkgDeps = getPluginSDKPackagePeerDependencies();

  const consoleProvidedSharedModules = sharedPluginModules.reduce<WebpackSharedObject>(
    (acc, moduleName) => {
      const { singleton, allowFallback } = getSharedModuleMetadata(moduleName);
      const providedVersionRange = sdkPkgDeps[moduleName];
      const moduleConfig: WebpackSharedConfig = { singleton };

      if (!allowFallback) {
        moduleConfig.import = false;
      }

      if (semver.validRange(providedVersionRange)) {
        moduleConfig.requiredVersion = providedVersionRange;
      }

      acc[moduleName] = moduleConfig;

      return acc;
    },
    {},
  );

  const sharedDynamicModules = Object.entries(dynamicModuleMaps).reduce<WebpackSharedObject>(
    (acc, [moduleName, dynamicModuleMap]) => {
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

      Object.values(dynamicModuleMap).forEach((request) => {
        acc[`${moduleName}/${request}`] = moduleConfig;
      });

      return acc;
    },
    {},
  );

  return { ...consoleProvidedSharedModules, ...sharedDynamicModules };
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

const getCompileTimeSharedModuleWarnings = (pkg: ConsolePluginPackageJSON): string[] => {
  const warnings: string[] = [];

  sharedPluginModules.forEach((moduleName) => {
    const { deprecated, aliased } = getSharedModuleMetadata(moduleName);

    if ((deprecated || aliased) && hasPackageDependency(pkg, moduleName)) {
      warnings.push(
        deprecated
          ? `[WARNING] Console provided shared module ${moduleName} has been deprecated: ${deprecated}`
          : `[WARNING] Console provided shared module ${moduleName} is aliased, beware of potential skew between aliased vs actual module code`,
      );
    }
  });

  return warnings;
};

const validateConsoleProvidedSharedModules = (pkg: ConsolePluginPackageJSON) => {
  const sdkPkgDeps = getPluginSDKPackagePeerDependencies();
  const result = new ValidationResult('package.json');

  sharedPluginModules.forEach((moduleName) => {
    const { allowFallback } = getSharedModuleMetadata(moduleName);

    // Skip modules that allow a fallback version to be provided by the plugin.
    // Also skip modules which are not explicitly listed in the plugin's dependencies.
    if (allowFallback || !hasPackageDependency(pkg, moduleName)) {
      return;
    }

    const providedVersionRange = sdkPkgDeps[moduleName];
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

/**
 * PatternFly packages that support dynamic modules to be used with webpack module federation.
 *
 * Console provided {@link sharedPluginModules} should _NOT_ be listed here.
 */
const dynamicModulePatternFlyPackages = [
  '@patternfly/react-core',
  '@patternfly/react-data-view',
  '@patternfly/react-icons',
  '@patternfly/react-table',
  '@patternfly/react-templates',
];

/**
 * Default shared dynamic module package definitions.
 */
export const dynamicModulePackageSpecs = dynamicModulePatternFlyPackages.reduce<
  DynamicModulePackageSpecs
>((acc, moduleName) => ({ ...acc, [moduleName]: {} }), {});

export const dynamicModuleImportTransformFilter = (moduleRequest: string) => {
  const isCode = /\.(jsx?|tsx?)$/.test(moduleRequest);
  const isVendor = moduleRequest.includes('/node_modules/');

  return isCode && (!isVendor || moduleRequest.includes('/node_modules/@openshift-console/'));
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
   * - `dependencies` and `optionalDependencies` keys must be mutually exclusive.
   *
   * Additional runtime environment specific `dependencies` available to Console plugins:
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
   * If a module request matches the `moduleFilter`, code of that module will be modified so that
   * any _index_ imports for given vendor packages become imports for specific dynamic modules of
   * these vendor packages.
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
   * (such as `@patternfly/react-core`) that would cause all of its code to be pulled into the
   * Console compilation and inflate the vendor bundle size.
   */
  sharedDynamicModuleSettings: Partial<{
    /**
     * Packages that support dynamic modules for use with webpack module federation.
     *
     * Each vendor package listed here should include a `dist/dynamic` directory containing
     * `package.json` files representing parts of that package to be shared separately between
     * the Console application and its plugins at runtime.
     *
     * If not specified, use a default list of PatternFly packages that support dynamic modules.
     */
    packageSpecs: DynamicModulePackageSpecs;

    /**
     * Paths to `node_modules` directories to search when resolving dynamic modules.
     *
     * Paths listed here _must_ be absolute.
     *
     * If not specified, the list will contain a single entry:
     * ```ts
     * path.resolve(process.cwd(), 'node_modules')
     * ```
     */
    modulePaths: string[];

    /**
     * Modules that match this filter will have their imports transformed.
     *
     * If not specified, the following conditions must be all true for a module to be matched:
     * - request ends with `.js`, `.jsx`, `.ts` or `.tsx`
     * - request does not contain `node_modules` path elements (i.e. not a vendor module request),
     *   _except_ for `@openshift-console/*` packages
     */
    moduleFilter: (moduleRequest: string) => boolean;
  }>;
}>;

/**
 * Generates Console dynamic plugin remote container and related assets.
 *
 * Refer to `console-dynamic-plugin-sdk/src/shared-modules.ts` for details on Console provided
 * shared modules and their configuration.
 *
 * @see {@link sharedPluginModules}
 * @see {@link getSharedModuleMetadata}
 */
export class ConsoleRemotePlugin implements WebpackPluginInstance {
  private readonly adaptedOptions: Required<ConsoleRemotePluginOptions>;

  private readonly baseDir = process.cwd();

  private readonly pkg = loadPluginPackageJSON();

  private readonly dynamicModuleMaps: Record<string, DynamicModuleMap>;

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

    validateConsoleBuildMetadata(this.adaptedOptions.pluginMetadata).report();

    const overlapDependencyNames = _.intersection(
      Object.keys(this.adaptedOptions.pluginMetadata.dependencies ?? {}),
      Object.keys(this.adaptedOptions.pluginMetadata.optionalDependencies ?? {}),
    );

    if (overlapDependencyNames.length > 0) {
      throw new Error(
        `Detected overlap between dependencies and optionalDependencies: ${overlapDependencyNames.join(
          ', ',
        )}`,
      );
    }

    const resolvedModulePaths = this.adaptedOptions.sharedDynamicModuleSettings.modulePaths ?? [
      path.resolve(process.cwd(), 'node_modules'),
    ];

    this.dynamicModuleMaps = resolveDynamicModuleMaps(
      this.adaptedOptions.sharedDynamicModuleSettings.packageSpecs ?? dynamicModulePackageSpecs,
      resolvedModulePaths,
      (pkgName) => hasPackageDependency(this.pkg, pkgName),
    );
  }

  apply(compiler: Compiler) {
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
      optionalDependencies,
      customProperties,
      exposedModules,
      displayName,
      description,
      disableStaticPlugins,
    } = pluginMetadata;

    const logger = compiler.getInfrastructureLogger(ConsoleRemotePlugin.name);

    // Dynamic plugin assets should be loaded from /api/plugins/<plugin-name> endpoint.
    // Console Bridge server will fetch the asset from the appropriate plugin web server.
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

    const sharedModules = getWebpackSharedModules(this.pkg, this.dynamicModuleMaps);

    new DynamicRemotePlugin({
      pluginMetadata: {
        name,
        version,
        dependencies,
        optionalDependencies,
        customProperties: _.merge({}, customProperties, {
          console: { displayName, description, disableStaticPlugins },
        }),
        exposedModules,
      },
      extensions,
      sharedModules,
      entryCallbackSettings: {
        name: REMOTE_ENTRY_CALLBACK,
      },
      entryScriptFilename:
        process.env.NODE_ENV === 'production'
          ? 'plugin-entry.[fullhash].min.js'
          : 'plugin-entry.js',
    }).apply(compiler);

    new DynamicModuleImportPlugin({
      dynamicModuleMaps: this.dynamicModuleMaps,
      moduleFilter: sharedDynamicModuleSettings.moduleFilter ?? dynamicModuleImportTransformFilter,
    }).apply(compiler);

    // Post-build validations performed before emitting assets
    compiler.hooks.emit.tap(ConsoleRemotePlugin.name, (compilation) => {
      if (validateExtensionIntegrity) {
        const result = new ExtensionValidator('Console plugin extensions').validate(
          compilation,
          extensions,
          exposedModules ?? {},
          path.dirname(path.resolve(this.baseDir, extensionsFile)),
        );

        if (result.hasErrors()) {
          const error = new compiler.webpack.WebpackError('ExtensionValidator has reported errors');
          error.details = result.formatErrors();
          error.file = extensionsFile;
          compilation.errors.push(error);
        }
      }

      getCompileTimeSharedModuleWarnings(this.pkg).forEach((message) => {
        compilation.warnings.push(new compiler.webpack.WebpackError(message));
      });
    });
  }
}
