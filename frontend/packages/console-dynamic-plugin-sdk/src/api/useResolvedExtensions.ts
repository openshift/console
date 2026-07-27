import type { UseResolvedExtensionsOptions as UseResolvedExtensionsOptionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useResolvedExtensions as useResolvedExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import type { UseResolvedExtensions } from '../extensions/console-types';
import type { Extension, ExtensionPredicate, ResolvedExtension } from '../types';

const hookOptions: UseResolvedExtensionsOptionsSDK = {
  useExtensionsImpl: useExtensions,
};

export const useResolvedExtensions: UseResolvedExtensions = <E extends Extension>(
  ...predicates: ExtensionPredicate<E>[]
): [ResolvedExtension<E>[], boolean, any[]] => {
  const predicate =
    predicates.length === 1
      ? predicates[0]
      : predicates.length > 1
      ? (extension: Extension): extension is E => predicates.some((guard) => guard(extension))
      : undefined;
  return useResolvedExtensionsSDK(predicate, hookOptions);
};
