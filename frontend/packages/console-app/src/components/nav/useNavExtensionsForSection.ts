import { useCallback, useMemo } from 'react';
import type { NavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useNavExtensionsForPerspective } from './useNavExtensionForPerspective';
import { getSortedNavExtensions } from './utils';

export const useNavExtensionsForSection = (section: string): LoadedExtension<NavExtension>[] => {
  const [activePerspective] = useActivePerspective();
  const extensions = useNavExtensionsForPerspective(activePerspective);
  const isExtensionForSection = useCallback(
    (extension) => section === extension.properties.section,
    [section],
  );
  return useMemo(() => {
    const filtered = extensions.filter(isExtensionForSection);
    return getSortedNavExtensions(filtered);
  }, [extensions, isExtensionForSection]);
};
