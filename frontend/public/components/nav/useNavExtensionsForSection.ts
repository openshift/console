import * as React from 'react';
import { LoadedExtension } from '@console/plugin-sdk';
import { useActivePerspective, NavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useNavExtensionsForPerspective } from './useNavExtensionForPerspective';
import { getSortedNavItems } from './utils';

export const useNavExtensionsForSection = (section: string): LoadedExtension<NavExtension>[] => {
  const [activePerspective] = useActivePerspective();
  const extensions = useNavExtensionsForPerspective(activePerspective);
  const isExtensionForSection = React.useCallback(
    (extension) => section === extension.properties.section,
    [section],
  );
  return React.useMemo(() => {
    const filtered = extensions.filter(isExtensionForSection);
    return getSortedNavItems(filtered);
  }, [extensions, isExtensionForSection]);
};
