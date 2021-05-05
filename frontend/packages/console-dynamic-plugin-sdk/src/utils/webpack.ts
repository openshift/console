import * as path from 'path';
import * as _ from 'lodash';
import { ConsolePluginMetadata } from '../schema/plugin-package';

/**
 * Adapt file paths in `exposedModules` to be relative to `contextDir`.
 *
 * _Existing file paths are expected to be relative to `pluginDir`._
 */
export const adaptExposedModulePaths = (
  exposedModules: ConsolePluginMetadata['exposedModules'],
  pluginDir: string,
  contextDir = pluginDir,
): typeof exposedModules =>
  _.mapValues(exposedModules || {}, (modulePath) => {
    const contextSensitivePath =
      pluginDir !== contextDir
        ? path.relative(contextDir, path.join(pluginDir, modulePath))
        : modulePath;

    const normalizedPath = path.normalize(contextSensitivePath);

    return path.isAbsolute(normalizedPath) || normalizedPath.startsWith('.')
      ? normalizedPath
      : `./${normalizedPath}`;
  });
