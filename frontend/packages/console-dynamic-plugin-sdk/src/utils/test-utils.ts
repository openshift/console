import { applyCodeRefSymbol } from '../coderefs/coderef-resolver';
import { SupportedExtension } from '../schema/console-extensions';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { Extension, RemoteEntryModule, CodeRef, Update } from '../types';

export const getPluginManifest = (
  name: string,
  version: string,
  extensions: Extension[] = [],
  disableStaticPlugins?: string[],
): ConsolePluginManifestJSON => ({
  name,
  version,
  extensions: extensions as SupportedExtension[],
  dependencies: { '@console/pluginAPI': '*' },
  disableStaticPlugins,
});

export const getExecutableCodeRefMock = <T = any>(
  resolvedValue: T,
): jest.Mock<ReturnType<CodeRef<T>>> => {
  const ref = jest.fn(() => Promise.resolve(resolvedValue));
  applyCodeRefSymbol<T>(ref);
  return ref;
};

export const getEntryModuleMocks = (requestedModule: {}): [
  ModuleFactoryMock,
  RemoteEntryModuleMock,
] => {
  const moduleFactory = jest.fn<VoidFunction>(() => requestedModule);

  const entryModule = {
    get: jest.fn(async () => moduleFactory),
    override: jest.fn<void>(),
  };

  return [moduleFactory, entryModule];
};

export type ModuleFactoryMock = jest.Mock<VoidFunction>;

export type RemoteEntryModuleMock = Update<
  RemoteEntryModule,
  {
    get: jest.Mock<ReturnType<RemoteEntryModule['get']>>;
    override: jest.Mock<void>;
  }
>;
