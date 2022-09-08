import * as React from 'react';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useActivePerspective, NavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useNavExtensionsForPerspective } from './useNavExtensionForPerspective';
import { getSortedNavExtensions } from './utils';

export const useNavExtensionsForSection = (section: string): LoadedExtension<NavExtension>[] => {
  const [activePerspective] = useActivePerspective();
  const extensions = useNavExtensionsForPerspective(activePerspective);
  const isExtensionForSection = React.useCallback(
    (extension) => section === extension.properties.section,
    [section],
  );
  return React.useMemo(() => {
    const filtered = extensions.filter(isExtensionForSection);
    return getSortedNavExtensions(filtered);
  }, [extensions, isExtensionForSection]);
};
