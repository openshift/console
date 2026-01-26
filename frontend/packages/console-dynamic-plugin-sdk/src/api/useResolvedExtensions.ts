import { useMemo } from 'react';
import { useResolvedExtensions as useResolvedExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useSortedExtensions } from '@console/plugin-sdk/src/utils/useSortedExtensions';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import { UseResolvedExtensions } from '../extensions/console-types';

export const useResolvedExtensions: UseResolvedExtensions = (predicate, options) => {
  const [resolvedExtensions, resolved, errors] = useResolvedExtensionsSDK(predicate, options);
  const translatedExtensions = useTranslatedExtensions(resolvedExtensions);
  const sortedExtensions = useSortedExtensions(translatedExtensions);

  return useMemo(() => [sortedExtensions, resolved, errors], [sortedExtensions, resolved, errors]);
};
