import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MultiListPage } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { useFlag } from '@console/shared';
import { FLAG_CAMEL_KAMELETS } from '../../../const';
import { CamelKameletBindingModel } from '../../../models';
import {
  getDynamicEventSourceModel,
  useEventSourceModels,
} from '../../../utils/fetch-dynamic-eventsources-utils';
import EventSourceList from './EventSourceList';

const EventSourceListPage: React.FC<React.ComponentProps<typeof MultiListPage>> = (props) => {
  const { t } = useTranslation();
  const { loaded: modelsLoaded, eventSourceModels } = useEventSourceModels();
  const isKameletEnabled = useFlag(FLAG_CAMEL_KAMELETS);
  const sourcesModel = isKameletEnabled
    ? [...eventSourceModels, CamelKameletBindingModel]
    : eventSourceModels;
  const flatten = (resources) =>
    modelsLoaded
      ? sourcesModel.flatMap((model) => resources[referenceForModel(model)]?.data ?? [])
      : [];
  const resources = React.useMemo(
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
  const getModelId = React.useCallback((obj: K8sResourceKind) => {
    const reference = referenceFor(obj);
    const model = getDynamicEventSourceModel(reference) || modelFor(reference);
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
        items: sourcesModel.map(({ id, label }) => ({ id, title: label })),
        reducer: getModelId,
        filter: rowFilterReducer,
      },
    ],
    [sourcesModel, getModelId, rowFilterReducer],
  );
  return (
    <MultiListPage
      {...props}
      label={t('knative-plugin~Event Sources')}
      rowFilters={eventSourceRowFilters}
      flatten={flatten}
      resources={resources}
      ListComponent={EventSourceList}
    />
  );
};

export default EventSourceListPage;
