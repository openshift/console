import { useState, useMemo, useEffect } from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingEventTypeModel } from '../models';

export const useEventTypesData = (namespace: string): [K8sResourceKind[], boolean, any] => {
  const [eventTypes, setEventTypes] = useState<K8sResourceKind[]>([]);
  const [eventTypesLoaded, setEventTypesLoaded] = useState(false);
  const [eventTypesLoadError, setEventTypesLoadError] = useState(null);

  const watchedResources = useMemo(
    () => ({
      eventTypes: {
        isList: true,
        kind: referenceForModel(EventingEventTypeModel),
        namespace,
        optional: true,
      },
    }),
    [namespace],
  );

  const extraResources = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(watchedResources);

  useEffect(() => {
    const resDataLoaded = Object.keys(extraResources).some((key) => extraResources[key].loaded);
    const resDataloadError = Object.keys(extraResources).every(
      (key) => extraResources[key].loadError,
    );
    const { eventTypes: eventTypesData } = extraResources;
    if (resDataLoaded) {
      if (eventTypesData.data.length > 0) {
        setEventTypes(eventTypesData.data);
      }
      setEventTypesLoaded(eventTypesData.loaded);
    } else if (resDataloadError) {
      setEventTypesLoadError(eventTypesData.loadError);
    }
  }, [extraResources]);

  return [eventTypes, eventTypesLoaded, eventTypesLoadError];
};
