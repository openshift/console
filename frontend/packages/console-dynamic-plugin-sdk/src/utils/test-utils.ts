import { applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
import { ConsolePluginManifest } from '../build-types';
import { Extension } from '../types';

export const getPluginManifest = (
  name: string,
  version: string,
  extensions: Extension[] = [],
  disableStaticPlugins?: string[],
): ConsolePluginManifest => ({
  name,
  version,
  extensions,
  customProperties: { console: { disableStaticPlugins } },
  baseURL: `http://example.com/${name}/`,
  loadScripts: ['plugin-entry.js'],
  registrationMethod: 'callback',
});

/**
 * Creates a mock CodeRef function that passes isExecutableCodeRef check.
 *
 * Note: We use a regular function with manual call tracking instead of jest.fn()
 * because Jest 30's mock functions have internal symbols that cause isExecutableCodeRef
 * to return false (it requires exactly one symbol - the codeRefSymbol).
 */
export const getExecutableCodeRefMock = <T = unknown>(
  resolvedValue: T,
): jest.Mock<Promise<T>, []> => {
  // Create a regular function to avoid Jest's internal symbols
  const calls: [][] = [];
  const fn = function () {
    calls.push([]);
    return Promise.resolve(resolvedValue);
  };

  // Apply the CodeRef symbol (must be the only symbol for isExecutableCodeRef to pass)
  applyCodeRefSymbol(fn);

  // Add mock-like properties for test assertions
  Object.defineProperty(fn, 'mock', {
    value: { calls },
    enumerable: false,
    configurable: true,
  });

  // Add getMockName for Jest compatibility
  (fn as any).getMockName = () => 'executableCodeRefMock';

  return (fn as unknown) as jest.Mock<Promise<T>, []>;
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
