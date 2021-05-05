import { ConsoleExtensionsJSON } from '../schema/console-extensions';
import { parseJSONC } from '../utils/jsonc';
import { ExtensionProvider } from './provider-types';

export const parseExtensionsFromJSON: ExtensionProvider = (filePath) =>
  parseJSONC<ConsoleExtensionsJSON>(filePath);
