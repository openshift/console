import type { UseResolvedExtensionsOptions as UseResolvedExtensionsOptionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useResolvedExtensions as useResolvedExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import type { UseResolvedExtensions } from '../extensions/console-types';
import type { Extension, ExtensionPredicate, ResolvedExtension } from '../types';

const hookOptions: UseResolvedExtensionsOptionsSDK = {
  useExtensionsImpl: useExtensions,
};

export const useResolvedExtensions: UseResolvedExtensions = <E extends Extension>(
  predicate: ExtensionPredicate<E>,
): [ResolvedExtension<E>[], boolean, any[]] => {
  return useResolvedExtensionsSDK(predicate, hookOptions);
};
