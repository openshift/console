import type { Extension, ExtensionPredicate } from '@openshift/dynamic-plugin-sdk';
import { useResolvedExtensions as useResolvedExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import type { UseResolvedExtensions } from '../extensions/console-types';

export const useResolvedExtensions: UseResolvedExtensions = <E extends Extension>(
  ...predicates: ExtensionPredicate<E>[]
) => {
  const compoundPredicate =
    predicates.length > 0
      ? (extension: Extension): extension is E => predicates.some((p) => p(extension))
      : undefined;

  const extensions = useExtensions(compoundPredicate);

  return useResolvedExtensionsSDK(extensions);
};
