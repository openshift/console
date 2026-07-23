import type { Extension, ExtensionPredicate } from '@openshift/dynamic-plugin-sdk';
import { useResolvedExtensions as useResolvedExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import type { UseResolvedExtensions } from '../extensions/console-types';

export const useResolvedExtensions: UseResolvedExtensions = <E extends Extension>(
  predicate: ExtensionPredicate<E>,
) => {
  const extensions = useExtensions(predicate);

  return useResolvedExtensionsSDK(extensions);
};
