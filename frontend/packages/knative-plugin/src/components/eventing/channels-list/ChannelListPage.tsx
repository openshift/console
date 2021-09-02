import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RowFilter } from '@console/dynamic-plugin-sdk';
import { MultiListPage } from '@console/internal/components/factory';
import { K8sResourceCommon, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import {
  getDynamicChannelModel,
  useChannelModels,
} from '../../../utils/fetch-dynamic-eventsources-utils';
import ChannelList from './ChannelList';

const ChannelListPage: React.FC<React.ComponentProps<typeof MultiListPage>> = (props) => {
  const { t } = useTranslation();
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

  const getModelId = React.useCallback((obj: K8sResourceCommon) => {
    const reference = referenceFor(obj);
    const model = getDynamicChannelModel(reference);
    return model.id;
  }, []);

  const channelRowFilter = React.useMemo<RowFilter<K8sResourceCommon>[]>(
    () => [
      {
        filterGroupName: 'Type',
        type: 'event-source-type',
        items: eventSourceChannels.map(({ id, label }) => ({ id, title: label })),
        reducer: getModelId,
        filter: (filter, obj) =>
          !filter.selected?.length || filter.selected?.includes(getModelId(obj)),
      },
    ],
    [eventSourceChannels, getModelId],
  );
  return (
    <MultiListPage
      {...props}
      label={t('knative-plugin~Channels')}
      flatten={flatten}
      resources={resources}
      rowFilters={channelRowFilter}
      ListComponent={ChannelList}
    />
  );
};

export default ChannelListPage;
