import * as readPkg from 'read-pkg';

/**
 * Console plugin metadata in `package.json` file.
 */
export type ConsolePluginMetadata = {
  /**
   * Plugin name. Should be the same as `metadata.name` of the corresponding
   * `ConsolePlugin` resource used to represent the plugin on the cluster.
   */
  name: string;
  /** Plugin version. Must be semver compliant. */
  version: string;
  /** User-friendly plugin name. */
  displayName?: string;
  /** User-friendly plugin description. */
  description?: string;
  /** Specific modules exposed through the plugin's remote entry. */
  exposedModules?: { [moduleName: string]: string };
  /**
   * Additional dependencies required for this plugin to work.
   * Values must be valid semver ranges or `*` representing any version.
   *
   * Console plugins may depend on other Console plugins or on Console
   * application itself, represented as `@console/pluginAPI` dependency.
   *
   * If present, `@console/pluginAPI` version range is matched against
   * the Console release version, as provided by the Console operator.
   */
  dependencies?: { [pluginName: string]: string };
  /** Disable the given static plugins when this plugin gets loaded. */
  disableStaticPlugins?: string[];
};

/**
 * Schema of Console plugin's `package.json` file.
 */
export type ConsolePackageJSON = readPkg.PackageJson & {
  /** Console plugin specific metadata. */
  consolePlugin: ConsolePluginMetadata;
};
