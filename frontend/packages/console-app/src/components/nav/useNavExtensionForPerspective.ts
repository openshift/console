import { useMemo, useCallback } from 'react';
import { NavExtension, isNavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import { LoadedExtension, useExtensions } from '@console/plugin-sdk';
import { usePerspectives } from '@console/shared/src';

export const useNavExtensionsForPerspective = (
  perspective: string,
): LoadedExtension<NavExtension>[] => {
  const allPerspectives = usePerspectives();
  const allNavExtensions = useExtensions<NavExtension>(isNavExtension);
  const isDefaultPerspective = useMemo(
    () =>
      allPerspectives?.some((p) => p.properties.default && p.properties.id === perspective) ??
      false,
    [allPerspectives, perspective],
  );
  const isExtensionForCurrentPerspective = useCallback(
    (extension) =>
      perspective === extension.properties.perspective ||
      (!extension.properties.perspective && isDefaultPerspective),
    [isDefaultPerspective, perspective],
  );
  return useMemo(() => allNavExtensions.filter(isExtensionForCurrentPerspective), [
    allNavExtensions,
    isExtensionForCurrentPerspective,
  ]);
};
