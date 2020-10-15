import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { useChannelModels } from '../../../utils/fetch-dynamic-eventsources-utils';
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
  return (
    <MultiListPage {...props} flatten={flatten} resources={resources} ListComponent={ChannelList} />
  );
};

export default ChannelListPage;
