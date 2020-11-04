import * as readPkg from 'read-pkg';

/**
 * Console plugin metadata in `package.json` file.
 */
export type ConsolePluginMetadata = {
  /** User-friendly plugin name. */
  displayName?: string;
  /** User-friendly plugin description. */
  description?: string;
  /** Specific modules exposed through the plugin's remote entry. */
  exposedModules?: { [moduleName: string]: string };
  /** Plugin API and other plugins required for this plugin to work. */
  dependencies: {
    '@console/pluginAPI': string;
    [pluginName: string]: string;
  };
};

/**
 * Schema of Console plugin's `package.json` file.
 */
export type ConsolePackageJSON = readPkg.PackageJson & {
  /** Console plugin specific metadata. */
  consolePlugin: ConsolePluginMetadata;
};
