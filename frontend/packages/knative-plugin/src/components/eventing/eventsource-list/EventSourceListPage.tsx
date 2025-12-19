import type { ComponentProps, FC } from 'react';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RowFilter } from '@console/dynamic-plugin-sdk';
import { MultiListPage } from '@console/internal/components/factory';
import {
  K8sResourceCommon,
  modelFor,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { useFlag } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { FLAG_CAMEL_KAMELETS } from '../../../const';
import { CamelKameletBindingModel } from '../../../models';
import {
  getDynamicEventSourceModel,
  useEventSourceModels,
} from '../../../utils/fetch-dynamic-eventsources-utils';
import EventSourceList from './EventSourceList';

const EventSourceListPage: FC<ComponentProps<typeof MultiListPage>> = (props) => {
  const { t } = useTranslation();
  const { loaded: modelsLoaded, eventSourceModels } = useEventSourceModels();
  const isKameletEnabled = useFlag(FLAG_CAMEL_KAMELETS);
  const sourcesModel = useMemo(
    () => (isKameletEnabled ? [...eventSourceModels, CamelKameletBindingModel] : eventSourceModels),
    [isKameletEnabled, eventSourceModels],
  );
  const flatten = (resources) =>
    modelsLoaded
      ? sourcesModel.flatMap((model) => resources[referenceForModel(model)]?.data ?? [])
      : [];
  const resources = useMemo(
    () =>
      modelsLoaded
        ? sourcesModel.map((model) => {
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
    [sourcesModel, modelsLoaded],
  );
  const getModelId = useCallback((obj: K8sResourceCommon) => {
    const reference = referenceFor(obj);
    const model = getDynamicEventSourceModel(reference) || modelFor(reference);
    return model.id;
  }, []);

  const eventSourceRowFilters = useMemo<RowFilter<K8sResourceCommon>[]>(
    () => [
      {
        filterGroupName: t('knative-plugin~Type'),
        type: 'event-source-type',
        items: sourcesModel.map(({ id, label }) => ({ id, title: label })),
        reducer: getModelId,
        filter: (filter, obj) =>
          !filter.selected?.length || filter.selected?.includes(getModelId(obj)),
      },
    ],
    [t, sourcesModel, getModelId],
  );
  return (
    <>
      <DocumentTitle>{t('knative-plugin~Event Sources')}</DocumentTitle>
      <MultiListPage
        {...props}
        label={t('knative-plugin~Event Sources')}
        rowFilters={eventSourceRowFilters}
        flatten={flatten}
        resources={resources}
        ListComponent={EventSourceList}
      />
    </>
  );
};

export default EventSourceListPage;
