import * as React from 'react';
import { K8sKind } from '@console/internal/module/k8s';
import { getEventSourceModelsWithAccess } from '../utils/create-eventsources-utils';
import { useEventSourceModels } from '../utils/fetch-dynamic-eventsources-utils';

export const useEventSourceModelsWithAccess = (
  namespace: string,
): { loaded: boolean; eventSourceModelsList: K8sKind[] } => {
  const { loaded, eventSourceModels } = useEventSourceModels();
  const [accessModelData, setAccessModelData] = React.useState({
    loaded: false,
    eventSourceModelsList: [],
  });

  React.useEffect(() => {
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
        .catch((err) => console.warn(err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  return accessModelData;
};
