import { useMemo, useCallback } from 'react';
import * as _ from 'lodash';
import type { ExtensionK8sModel, K8sModel } from '@console/dynamic-plugin-sdk';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { referenceForExtensionModel, useModelFinder } from '@console/internal/module/k8s';
import type { Perspective } from './perspective-utils';
import { usePerspectives } from './perspective-utils';
import { useTelemetry } from './useTelemetry';
import { useUserPreference } from './useUserPreference';

type PinnedResourcesType = {
  [perspective: string]: string[];
};

const PINNED_RESOURCES_USER_PREFERENCE_KEY = 'console.pinnedResources';

export const usePinnedResources = (): [string[], (pinnedResources: string[]) => void, boolean] => {
  const fireTelemetryEvent = useTelemetry();
  const [activePerspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const { findModel } = useModelFinder();

  const getPins = useCallback(
    (id: string, defaultPins: ExtensionK8sModel[]): ExtensionK8sModel[] => {
      let customizedPins: ExtensionK8sModel[] = null;
      if (window.SERVER_FLAGS.perspectives) {
        const perspectives: Perspective[] = JSON.parse(window.SERVER_FLAGS.perspectives);
        const perspective = perspectives.find((p: Perspective) => p.id === id);
        customizedPins = perspective?.pinnedResources?.map((pr) => {
          const model: K8sModel = findModel(pr.group, pr.resource);
          return (
            model && {
              group: pr.group,
              version: pr.version,
              kind: model.kind,
            }
          );
        });
      }
      return customizedPins ?? defaultPins ?? [];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const defaultPins: PinnedResourcesType = useMemo(
    () =>
      perspectiveExtensions.reduce(
        (acc, e) => ({
          ...acc,
          [e.properties.id]: getPins(e.properties.id, e.properties.defaultPins)?.map((gvk) =>
            referenceForExtensionModel(gvk),
          ),
        }),
        {},
      ),
    [perspectiveExtensions, getPins],
  );
  const [pinnedResources, setPinnedResources, loaded] = useUserPreference<PinnedResourcesType>(
    PINNED_RESOURCES_USER_PREFERENCE_KEY,
    null,
    true,
  );

  const pins = useMemo(() => {
    if (!loaded) {
      return [];
    }
    if (_.isEmpty(pinnedResources) || !pinnedResources?.[activePerspective]) {
      return defaultPins[activePerspective] ?? [];
    }
    return pinnedResources[activePerspective] ?? [];
  }, [loaded, pinnedResources, activePerspective, defaultPins]);

  const setPins = useCallback(
    (newPins: string[]) => {
      setPinnedResources((prevPR) => {
        _.difference(
          newPins,
          prevPR?.[activePerspective]?.length > 0 ? prevPR[activePerspective] : pins,
        ).forEach((resource) =>
          fireTelemetryEvent('Navigation Added', {
            resource,
            perspective: activePerspective,
          }),
        );

        _.difference(
          prevPR?.[activePerspective]?.length > 0 ? prevPR[activePerspective] : pins,
          newPins,
        ).forEach((resource) =>
          fireTelemetryEvent('Navigation Removed', {
            resource,
            perspective: activePerspective,
          }),
        );

        return { ...prevPR, [activePerspective]: newPins };
      });
    },
    [setPinnedResources, activePerspective, pins, fireTelemetryEvent],
  );

  return [pins, setPins, loaded];
};
