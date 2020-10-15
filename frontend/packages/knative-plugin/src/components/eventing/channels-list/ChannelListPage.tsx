import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import {
  getDynamicChannelModel,
  useChannelModels,
} from '../../../utils/fetch-dynamic-eventsources-utils';
import ChannelList from './ChannelList';

const ChannelListPage: React.FC<React.ComponentProps<typeof MultiListPage>> = (props) => {
  const { loaded: modelsLoaded, eventSourceChannels } = useChannelModels();
  const flatten = (resources) =>
    modelsLoaded
      ? eventSourceChannels.flatMap((model) => resources[referenceForModel(model)]?.data ?? [])
      : [];
  const resources = React.useMemo(
    () =>
      modelsLoaded
        ? eventSourceChannels.map((model) => {
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
    [eventSourceChannels, modelsLoaded],
  );

  const getModelId = React.useCallback((obj: K8sResourceKind) => {
    const reference = referenceFor(obj);
    const model = getDynamicChannelModel(reference);
    return model.id;
  }, []);

  const rowFilterReducer = React.useCallback(
    ({ selected }: { selected: Set<string>; all: string[] }, obj: K8sResourceKind) =>
      selected.size === 0 || selected.has(getModelId(obj)),
    [getModelId],
  );

  const channelRowFilter: RowFilter[] = React.useMemo(
    () => [
      {
        filterGroupName: 'Type',
        type: 'event-source-type',
        items: eventSourceChannels.map(({ id, label }) => ({ id, title: label })),
        reducer: getModelId,
        filter: rowFilterReducer,
      },
    ],
    [eventSourceChannels, getModelId, rowFilterReducer],
  );
  return (
    <MultiListPage
      {...props}
      flatten={flatten}
      resources={resources}
      rowFilters={channelRowFilter}
      ListComponent={ChannelList}
    />
  );
};

export default ChannelListPage;
