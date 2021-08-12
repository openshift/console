import {
  UseK8sWatchResource,
  UseK8sWatchResources,
  UseResolvedExtensions,
  ConsoleFetch,
  ConsoleFetchJSON,
  ConsoleFetchText,
} from './api-types';

export * from './api-types';

const newMockImpl = <T extends (...args: any) => any>(): T => {
  return ((() => {
    throw new Error(
      'You need to configure webpack externals to use this component or function at runtime.',
    );
  }) as unknown) as T;
};

const mockProperties = <T extends any, K extends keyof T>(obj: T, ...keys: K[]) => {
  keys.forEach((key) => {
    obj[key] = (newMockImpl() as unknown) as T[K];
  });
};

export const useK8sWatchResource: UseK8sWatchResource = newMockImpl();
export const useK8sWatchResources: UseK8sWatchResources = newMockImpl();
export const useResolvedExtensions: UseResolvedExtensions = newMockImpl();
export const consoleFetch: ConsoleFetch = newMockImpl();
export const consoleFetchJSON: ConsoleFetchJSON = newMockImpl();
mockProperties(consoleFetchJSON, 'delete', 'post', 'put', 'patch');
export const consoleFetchText: ConsoleFetchText = newMockImpl();
