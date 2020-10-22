import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import EventSourceList from './EventSourceList';
import {
  getDynamicEventSourceModel,
  useEventSourceModels,
} from '../../../utils/fetch-dynamic-eventsources-utils';

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
  const getModelId = React.useCallback((obj: K8sResourceKind) => {
    const reference = referenceFor(obj);
    const model = getDynamicEventSourceModel(reference);
    return model.id;
  }, []);

  const rowFilterReducer = React.useCallback(
    ({ selected }: { selected: Set<string>; all: string[] }, obj: K8sResourceKind) =>
      selected.size === 0 || selected.has(getModelId(obj)),
    [getModelId],
  );

  const eventSourceRowFilters: RowFilter[] = React.useMemo(
    () => [
      {
        filterGroupName: 'Type',
        type: 'event-source-type',
        items: eventSourceModels.map(({ id, label }) => ({ id, title: label })),
        reducer: getModelId,
        filter: rowFilterReducer,
      },
    ],
    [eventSourceModels, getModelId, rowFilterReducer],
  );
  return (
    <MultiListPage
      {...props}
      rowFilters={eventSourceRowFilters}
      flatten={flatten}
      resources={resources}
      ListComponent={EventSourceList}
    />
  );
};

export default EventSourceListPage;
