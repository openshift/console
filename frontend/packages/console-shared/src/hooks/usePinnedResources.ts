import { useMemo, useCallback } from 'react';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { useUserSettingsCompatibility } from './useUserSettingsCompatibility';
import { PINNED_RESOURCES_LOCAL_STORAGE_KEY } from '../constants';
import { useActivePerspective } from './useActivePerspective';

type PinnedResourcesType = {
  [perspective: string]: string[];
};

const PINNED_RESOURCES_CONFIG_MAP_KEY = 'console.pinnedResources';

export const usePinnedResources = (): [string[], (pinnedResources: string[]) => void, boolean] => {
  const [activePerspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const [pinnedResources, setPinnedResources, loaded] = useUserSettingsCompatibility<
    PinnedResourcesType
  >(PINNED_RESOURCES_CONFIG_MAP_KEY, PINNED_RESOURCES_LOCAL_STORAGE_KEY, {}, true);

  const pins = useMemo(() => {
    if (!loaded) {
      return [];
    }
    if (pinnedResources?.[activePerspective]) {
      return pinnedResources[activePerspective];
    }
    const activePerspectiveExtension = perspectiveExtensions.find(
      (extension) => extension.properties.id === activePerspective,
    );
    return activePerspectiveExtension?.properties?.defaultPins || [];
  }, [loaded, pinnedResources, activePerspective, perspectiveExtensions]);

  const setPins = useCallback(
    (newPins: string[]) => {
      setPinnedResources((prevPR) => ({ ...prevPR, [activePerspective]: newPins }));
    },
    [activePerspective, setPinnedResources],
  );

  return [pins, setPins, loaded];
};
