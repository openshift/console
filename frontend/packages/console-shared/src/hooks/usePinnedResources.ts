import { useMemo, useCallback } from 'react';
import * as _ from 'lodash';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { useUserSettingsCompatibility } from './useUserSettingsCompatibility';
import { PINNED_RESOURCES_LOCAL_STORAGE_KEY } from '../constants';
import { useActivePerspective } from './useActivePerspective';
import { useTelemetry } from './useTelemetry';

type PinnedResourcesType = {
  [perspective: string]: string[];
};

const PINNED_RESOURCES_CONFIG_MAP_KEY = 'console.pinnedResources';

export const usePinnedResources = (): [string[], (pinnedResources: string[]) => void, boolean] => {
  const fireTelemetryEvent = useTelemetry();
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
      setPinnedResources((prevPR) => {
        _.difference(newPins, prevPR[activePerspective]).forEach((resource) =>
          fireTelemetryEvent('Navigation Added', {
            resource,
            perspective: activePerspective,
          }),
        );

        _.difference(prevPR[activePerspective], newPins).forEach((resource) =>
          fireTelemetryEvent('Navigation Removed', {
            resource,
            perspective: activePerspective,
          }),
        );

        return { ...prevPR, [activePerspective]: newPins };
      });
    },
    [activePerspective, setPinnedResources, fireTelemetryEvent],
  );

  return [pins, setPins, loaded];
};
