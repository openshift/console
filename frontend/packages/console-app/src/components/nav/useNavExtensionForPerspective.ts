import { useMemo, useCallback } from 'react';
import type { NavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import { isNavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';

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
