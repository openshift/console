import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { ConsolePluginMetadata } from '../schema/plugin-package';
import { extensionsFile, extensionsTSFile } from '../constants';
import { ExtensionProvider } from './provider-types';
import { parseExtensionsFromJSON } from './provider-json';
import { parseExtensionsFromTypeScript } from './provider-typescript';

/**
 * Return all supported Console extensions files and their providers.
 */
export const getSupportedExtensionFiles = () => [
  {
    fileName: extensionsFile,
    provider: parseExtensionsFromJSON,
  },
  {
    fileName: extensionsTSFile,
    provider: parseExtensionsFromTypeScript,
  },
];

/**
 * Parse Console extensions from supported files relative to `pluginDir`.
 *
 * Throws an error in any of the following cases:
 *
 * - no extensions files found
 * - multiple extensions files found
 * - problems while parsing an extensions file
 */
export const parseConsoleExtensions = (
  pluginDir: string,
  exposedModules: ConsolePluginMetadata['exposedModules'],
): ProviderDelegateResult => {
  const extensionsFileCandidates = getSupportedExtensionFiles()
    .map((f) => ({ ...f, filePath: path.resolve(pluginDir, f.fileName) }))
    .filter((f) => fs.existsSync(f.filePath));

  if (extensionsFileCandidates.length === 0) {
    throw new Error('No Console extensions files found');
  } else if (extensionsFileCandidates.length > 1) {
    throw new Error('Multiple Console extensions files found');
  }

  const selectedFile = extensionsFileCandidates[0];
  const selectedFilePath = selectedFile.filePath;

  // eslint-disable-next-line no-console
  console.log(
    `Parsing Console extensions from ${chalk.green(
      path.relative(process.cwd(), selectedFilePath),
    )}`,
  );

  return {
    extensions: selectedFile.provider(selectedFilePath, exposedModules),
    extensionsFilePath: selectedFilePath,
  };
};

type ProviderDelegateResult = {
  /** Parsed Console extensions. */
  extensions: ReturnType<ExtensionProvider>;
  /** Path to extensions source file. */
  extensionsFilePath: string;
};
