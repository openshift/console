import { useMemo, useCallback } from 'react';
import * as _ from 'lodash';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { referenceForExtensionModel, useModelFinder } from '@console/internal/module/k8s';
import { PINNED_RESOURCES_LOCAL_STORAGE_KEY } from '../constants';
import { usePerspectives, Perspective } from './perspective-utils';
import { useTelemetry } from './useTelemetry';
import { useUserSettingsCompatibility } from './useUserSettingsCompatibility';

type PinnedResourcesType = {
  [perspective: string]: string[];
};

const PINNED_RESOURCES_CONFIG_MAP_KEY = 'console.pinnedResources';

const getCustomizedPins = (id: string) => {
  if (window.SERVER_FLAGS.perspectives) {
    const perspectives: Perspective[] = JSON.parse(window.SERVER_FLAGS.perspectives);
    const perspective = perspectives.find((p: Perspective) => p.id === id && p?.pinnedResources);
    return perspective?.pinnedResources;
  }
  return null;
};

export const usePinnedResources = (): [string[], (pinnedResources: string[]) => void, boolean] => {
  const fireTelemetryEvent = useTelemetry();
  const [activePerspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const { findModel } = useModelFinder();
  const pinsFromExtension: PinnedResourcesType = useMemo(
    () =>
      perspectiveExtensions.reduce(
        (acc, e) => ({
          ...acc,
          [e.properties.id]: (e.properties.defaultPins || []).map((gvk) => {
            const model = {
              group: gvk.group,
              version: gvk.version,
              kind: gvk.kind,
            };
            return referenceForExtensionModel(model);
          }),
        }),
        {},
      ),
    [perspectiveExtensions],
  );
  const defaultPins: PinnedResourcesType = useMemo(
    () =>
      perspectiveExtensions.reduce(
        (acc, e) => ({
          ...acc,
          [e.properties.id]: (
            getCustomizedPins(e.properties.id) ||
            e.properties.defaultPins ||
            []
          ).map((gvk) => {
            const model = {
              group: gvk.group,
              version: gvk.version,
              kind: gvk.kind ?? _.get(findModel(gvk.group, gvk.resource), 'kind'),
            };
            return referenceForExtensionModel(model);
          }),
        }),
        {},
      ),
    [perspectiveExtensions],
  );
  const [pinnedResources, setPinnedResources, loaded] = useUserSettingsCompatibility<
    PinnedResourcesType
  >(PINNED_RESOURCES_CONFIG_MAP_KEY, PINNED_RESOURCES_LOCAL_STORAGE_KEY, defaultPins, true);

  const pins = useMemo(() => {
    if (!loaded) {
      return [];
    }
    if (
      JSON.stringify(pinnedResources[activePerspective]) ===
        JSON.stringify(pinsFromExtension[activePerspective]) &&
      defaultPins[activePerspective]
    ) {
      return defaultPins[activePerspective];
    }
    return pinnedResources[activePerspective] ?? [];
  }, [loaded, pinnedResources, activePerspective, pinsFromExtension, defaultPins]);

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
