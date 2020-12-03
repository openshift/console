import { useMemo } from 'react';
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
  const activePerspectiveExtension = perspectiveExtensions.find(
    (p) => p.properties.id === activePerspective,
  );
  const [pinnedResources, setPinnedResources, loaded] = useUserSettingsCompatibility<
    PinnedResourcesType
  >(
    PINNED_RESOURCES_CONFIG_MAP_KEY,
    PINNED_RESOURCES_LOCAL_STORAGE_KEY,
    { [activePerspective]: activePerspectiveExtension.properties.defaultPins },
    true,
  );
  const pins = useMemo(() => (loaded ? pinnedResources[activePerspective] ?? [] : []), [
    loaded,
    pinnedResources,
    activePerspective,
  ]);
  return [
    pins,
    (pr: string[]) => {
      setPinnedResources((prevPR) => ({ ...prevPR, [activePerspective]: pr }));
    },
    loaded,
  ];
};
