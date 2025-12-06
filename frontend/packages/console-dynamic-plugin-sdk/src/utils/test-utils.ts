import { StandardConsolePluginManifest } from '../build-types';
import { applyCodeRefSymbol } from '../coderefs/coderef-resolver';
import { Extension } from '../types';

export const getPluginManifest = (
  name: string,
  version: string,
  extensions: Extension[] = [],
  disableStaticPlugins?: string[],
): StandardConsolePluginManifest => ({
  name,
  version,
  extensions,
  customProperties: { console: { disableStaticPlugins } },
  baseURL: `http://example.com/${name}/`,
  loadScripts: ['plugin-entry.js'],
  registrationMethod: 'callback',
});

export const getExecutableCodeRefMock = <T = unknown>(resolvedValue: T): jest.Mock => {
  const ref = jest.fn(() => Promise.resolve(resolvedValue));
  applyCodeRefSymbol<T>(ref);
  return ref as jest.Mock;
};

export const getEntryModuleMocks = (
  requestedModule: Record<string, unknown>,
): [ModuleFactoryMock, RemoteEntryModuleMock] => {
  const moduleFactory = jest.fn(() => requestedModule);

  const entryModule = {
    get: jest.fn(() => Promise.resolve(moduleFactory)),
    init: jest.fn(),
  };

  return [moduleFactory, entryModule];
};

export type ModuleFactoryMock = jest.Mock;

export type RemoteEntryModuleMock = {
  get: jest.Mock;
  init: jest.Mock;
  override?: jest.Mock;
};
