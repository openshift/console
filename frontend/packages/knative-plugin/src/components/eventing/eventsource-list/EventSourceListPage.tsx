import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import EventSourceList from './EventSourceList';
import { useEventSourceModels } from '../../../utils/fetch-dynamic-eventsources-utils';
import { referenceForModel } from '@console/internal/module/k8s';

const EventSourceListPage: React.FC<React.ComponentProps<typeof MultiListPage>> = (props) => {
  const { loaded: modelsLoaded, eventSourceModels } = useEventSourceModels();
  const flatten = (resources) =>
    modelsLoaded
      ? eventSourceModels.flatMap((model) => resources[referenceForModel(model)]?.data ?? [])
      : [];
  const resources = React.useMemo(
    () =>
      modelsLoaded
        ? eventSourceModels.map((model) => {
            const { namespaced } = model;

            return {
              isList: true,
              namespaced,
              kind: referenceForModel(model),
              prop: referenceForModel(model),
              isOptional: true,
            };
          })
        : [],
    [eventSourceModels, modelsLoaded],
  );
  return (
    <MultiListPage
      {...props}
      flatten={flatten}
      resources={resources}
      ListComponent={EventSourceList}
    />
  );
};

export default EventSourceListPage;
