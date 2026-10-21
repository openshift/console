import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as _ from 'lodash';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import type { DynamicModuleMap } from '../utils/dynamic-module-parser';
import { getDynamicModuleMap } from '../utils/dynamic-module-parser';
import type { DynamicModuleImportLoaderOptions } from './loaders/dynamic-module-import-loader';

export type DynamicModulePackageSpecs = {
  [pkgName: string]: Partial<{
    /** @default 'dist/dynamic' */
    dynamicModuleDir: string;

    /** @default 'dist/dynamic-modules.json' */
    dynamicModuleMap: string;

    /** @default 'dist/esm/index.js' */
    indexModule: string;

    /** @default 'module' */
    resolutionField: string;
  }>;
};

const isDynamicModuleMap = (obj: unknown): obj is DynamicModuleMap =>
  _.isPlainObject(obj) && Object.values(obj).every((value) => typeof value === 'string');

/**
 * Parse or generate dynamic module maps for the provided packages.
 */
export const resolveDynamicModuleMaps = (
  /** Dynamic module package definitions. */
  packageSpecs: DynamicModulePackageSpecs,
  /** Absolute paths to `node_modules` directories to search. */
  modulePaths: string[],
  /** Optional check if the package is available. */
  isPackageAvailable: (pkgName: string) => boolean = () => true,
) =>
  Object.entries(packageSpecs).reduce<Record<string, DynamicModuleMap>>(
    (
      acc,
      [
        pkgName,
        {
          dynamicModuleDir = 'dist/dynamic',
          dynamicModuleMap = 'dist/dynamic-modules.json',
          indexModule = 'dist/esm/index.js',
          resolutionField = 'module',
        },
      ],
    ) => {
      if (!isPackageAvailable(pkgName)) {
        return acc;
      }

      const basePath = modulePaths
        .map((p) => path.resolve(p, pkgName))
        .find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());

      if (!basePath) {
        // eslint-disable-next-line no-console
        console.warn(`Cannot resolve base path for package ${pkgName}`);
        return acc;
      }

      const dynamicModuleMapPath = path.resolve(basePath, dynamicModuleMap);

      if (fs.existsSync(dynamicModuleMapPath)) {
        try {
          const obj = JSON.parse(fs.readFileSync(dynamicModuleMapPath, 'utf-8'));

          if (!isDynamicModuleMap(obj)) {
            throw new Error('Invalid dynamic module map object');
          }

          // eslint-disable-next-line no-console
          console.info(
            `${chalk.bold(pkgName)} dynamic modules taken from ${chalk.green(dynamicModuleMap)}`,
          );

          acc[pkgName] = obj;
          return acc;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Failed to parse ${chalk.bold(pkgName)} dynamic modules`, e);
        }
      }

      const obj = getDynamicModuleMap(basePath, dynamicModuleDir, indexModule, resolutionField);

      // eslint-disable-next-line no-console
      console.info(
        `${chalk.bold(pkgName)} dynamic modules generated from ${chalk.green(dynamicModuleDir)}`,
      );

      acc[pkgName] = obj;
      return acc;
    },
    {},
  );

export type DynamicModuleImportPluginOptions = {
  /**
   * Module specifier of the loader to use.
   *
   * By default, use `@openshift-console/dynamic-plugin-sdk-webpack` based module specifier.
   */
  loader?: string;

  /**
   * Resolved module maps for all packages that support dynamic modules.
   *
   * @example
   * ```ts
   * {
   *   '@patternfly/react-core': {
   *     Alert: 'dist/dynamic/components/Alert',
   *     AlertProps: 'dist/dynamic/components/Alert',
   *     Wizard: 'dist/dynamic/components/Wizard',
   *   }
   * }
   * ```
   *
   * @see {@link resolveDynamicModuleMaps}
   */
  dynamicModuleMaps: Record<string, DynamicModuleMap>;

  /**
   * Modules that match this filter will have their imports transformed.
   *
   * Such transformations should only apply to JavaScript or TypeScript code.
   */
  moduleFilter: (moduleRequest: string) => boolean;
};

/**
 * Transforms import statements using Console dynamic module import loader.
 *
 * The loader is referenced using a module specifier since webpack takes care of creating
 * and initializing all loaders.
 */
export class DynamicModuleImportPlugin implements WebpackPluginInstance {
  constructor(private readonly options: DynamicModuleImportPluginOptions) {}

  apply(compiler: Compiler) {
    const {
      loader = '@openshift-console/dynamic-plugin-sdk-webpack/lib/webpack/loaders/dynamic-module-import-loader',
      dynamicModuleMaps,
      moduleFilter,
    } = this.options;

    compiler.hooks.thisCompilation.tap(DynamicModuleImportPlugin.name, (compilation) => {
      const modifiedModules: string[] = [];

      compiler.webpack.NormalModule.getCompilationHooks(compilation).beforeLoaders.tap(
        DynamicModuleImportPlugin.name,
        (_loaders, normalModule) => {
          const { userRequest } = normalModule;

          const moduleRequest = userRequest.substring(
            userRequest.lastIndexOf('!') === -1 ? 0 : userRequest.lastIndexOf('!') + 1,
          );

          if (!modifiedModules.includes(moduleRequest) && moduleFilter(moduleRequest)) {
            const loaderOptions: DynamicModuleImportLoaderOptions = {
              dynamicModuleMaps,
              resourceMetadata: { jsx: /\.(jsx|tsx)$/.test(moduleRequest) },
              skipImportPrefixes: [
                // Imports for PatternFly deprecated APIs
                '@patternfly/react-core/deprecated',
                // Imports for PatternFly internal APIs (not exposed via package index)
                '@patternfly/react-icons/dist/esm/createIcon',
                '@patternfly/react-core/dist/esm/components/Tooltip/',
                '@patternfly/react-core/dist/esm/components/Popover/',
              ],
            };

            normalModule.loaders.push({ loader, options: loaderOptions } as any);
            modifiedModules.push(moduleRequest);
          }
        },
      );
    });
  }
}
