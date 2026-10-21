import type { ComponentProps, FC } from 'react';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { RowFilter } from '@console/dynamic-plugin-sdk';
import { MultiListPage } from '@console/internal/components/factory';
import type { K8sResourceCommon } from '@console/internal/module/k8s';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import {
  getDynamicChannelModel,
  useChannelModels,
} from '../../../utils/fetch-dynamic-eventsources-utils';
import ChannelList from './ChannelList';

const ChannelListPage: FC<ComponentProps<typeof MultiListPage>> = (props) => {
  const { t } = useTranslation();
  const { loaded: modelsLoaded, eventSourceChannels } = useChannelModels();
  const flatten = (resources) =>
    modelsLoaded
      ? eventSourceChannels.flatMap((model) => resources[referenceForModel(model)]?.data ?? [])
      : [];
  const resources = useMemo(
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

  const getModelId = useCallback((obj: K8sResourceCommon) => {
    const reference = referenceFor(obj);
    const model = getDynamicChannelModel(reference);
    return model.id;
  }, []);

  const channelRowFilter = useMemo<RowFilter<K8sResourceCommon>[]>(
    () => [
      {
        filterGroupName: t('knative-plugin~Type'),
        type: 'event-source-type',
        items: eventSourceChannels.map(({ id, label }) => ({ id, title: label })),
        reducer: getModelId,
        filter: (filter, obj) =>
          !filter.selected?.length || filter.selected?.includes(getModelId(obj)),
      },
    ],
    [eventSourceChannels, getModelId, t],
  );
  return (
    <>
      <DocumentTitle>{t('knative-plugin~Channels')}</DocumentTitle>
      <MultiListPage
        {...props}
        label={t('knative-plugin~Channels')}
        flatten={flatten}
        resources={resources}
        rowFilters={channelRowFilter}
        ListComponent={ChannelList}
      />
    </>
  );
};

export default ChannelListPage;
