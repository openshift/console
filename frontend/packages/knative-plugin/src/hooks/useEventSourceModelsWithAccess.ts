import { useState, useEffect } from 'react';
import { K8sModel } from '@console/internal/module/k8s';
import { getEventSourceModelsWithAccess } from '../utils/create-eventsources-utils';
import { useEventSourceModels } from '../utils/fetch-dynamic-eventsources-utils';

export const useEventSourceModelsWithAccess = (
  namespace: string,
): { loaded: boolean; eventSourceModelsList: K8sModel[] } => {
  const { loaded, eventSourceModels } = useEventSourceModels();
  const [accessModelData, setAccessModelData] = useState({
    loaded: false,
    eventSourceModelsList: [] as K8sModel[],
  });

  useEffect(() => {
    if (loaded) {
      const eventSourceModelsWithAccess = getEventSourceModelsWithAccess(
        namespace,
        eventSourceModels,
      );
      Promise.all([...eventSourceModelsWithAccess])
        .then((results) => {
          const modelsWithAccess = results?.reduce(
            (acc, model) => [...acc, ...(model ? [model] : [])],
            [],
          );
          setAccessModelData({ loaded: true, eventSourceModelsList: modelsWithAccess });
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.warn('Failed to get event source models', err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  return accessModelData;
};
