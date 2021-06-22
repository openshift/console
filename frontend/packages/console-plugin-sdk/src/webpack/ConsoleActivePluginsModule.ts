import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import { adaptExposedModulePaths } from '@console/dynamic-plugin-sdk/src/utils/webpack';
import { extensionsFile, extensionsTSFile } from '@console/dynamic-plugin-sdk/src/constants';
import { PluginPackage } from '../codegen/plugin-resolver';
import { getActivePluginsModule, getDynamicExtensions } from '../codegen/active-plugins';

type VirtualModulesPluginAPI = {
  writeModule: (filePath: string, source: string) => void;
};

const getExposedModules = (pkg: PluginPackage) =>
  adaptExposedModulePaths(pkg.consolePlugin.exposedModules, pkg._path);

const getPluginFiles = (pkg: PluginPackage) => {
  const files = new Set<string>();

  files.add(path.resolve(pkg._path, extensionsFile));
  files.add(path.resolve(pkg._path, extensionsTSFile));

  Object.values(getExposedModules(pkg)).forEach((modulePath) => {
    files.add(path.resolve(pkg._path, modulePath));
  });

  return files;
};

const getFileLastModified = (f: string) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : -1);

export class ConsoleActivePluginsModule {
  constructor(
    private readonly pluginPackages: PluginPackage[],
    private readonly virtualModules: VirtualModulesPluginAPI,
  ) {}

  apply(compiler: webpack.Compiler) {
    const lastModified = new Map<string, number>();
    let errors: string[] = [];

    const checkFilesModified = () => {
      let filesModified = false;

      this.pluginPackages.forEach((pkg) => {
        getPluginFiles(pkg).forEach((f) => {
          const mtime = getFileLastModified(f);
          filesModified = filesModified || mtime !== lastModified.get(f);
          lastModified.set(f, mtime);
        });
      });

      return filesModified;
    };

    const writeModule = () => {
      if (checkFilesModified()) {
        errors = [];

        this.virtualModules.writeModule(
          'node_modules/@console/active-plugins.js',
          getActivePluginsModule(
            this.pluginPackages,
            () => `
              import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
            `,
            (pkg) =>
              getDynamicExtensions(
                pkg,
                getExposedModules(pkg),
                (errorMessage) => {
                  errors.push(errorMessage);
                },
                (codeRefSource) => `applyCodeRefSymbol(${codeRefSource})`,
              ),
          ),
        );
      }
    };

    const addFilesToCompilation = (compilation: webpack.compilation.Compilation) => {
      this.pluginPackages.forEach((pkg) => {
        getPluginFiles(pkg).forEach((f) => {
          compilation.fileDependencies.add(f);
        });
      });
    };

    const addErrorsToCompilation = (compilation: webpack.compilation.Compilation) => {
      errors.forEach((e) => {
        compilation.errors.push(new Error(e));
      });
    };

    compiler.hooks.afterResolvers.tap(ConsoleActivePluginsModule.name, writeModule);
    compiler.hooks.watchRun.tap(ConsoleActivePluginsModule.name, writeModule);
    compiler.hooks.afterCompile.tap(ConsoleActivePluginsModule.name, addFilesToCompilation);

    compiler.hooks.shouldEmit.tap(ConsoleActivePluginsModule.name, (compilation) => {
      addErrorsToCompilation(compilation);
      return errors.length === 0;
    });
  }
}
