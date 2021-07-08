import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import { extensionsFile } from '@console/dynamic-plugin-sdk/src/constants';
import { getActivePluginsModule, getDynamicExtensions } from '../codegen/active-plugins';
import { PluginPackage } from '../codegen/plugin-resolver';

type VirtualModulesPluginAPI = {
  writeModule: (filePath: string, source: string) => void;
};

const getExtensionsFilePath = (pkg: PluginPackage) => path.resolve(pkg._path, extensionsFile);

const getPluginFiles = (pkg: PluginPackage) => {
  const files = new Set<string>();
  files.add(getExtensionsFilePath(pkg));

  Object.keys(pkg.consolePlugin.exposedModules || {}).forEach((moduleName) => {
    files.add(path.resolve(pkg._path, pkg.consolePlugin.exposedModules[moduleName]));
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
                getExtensionsFilePath(pkg),
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
