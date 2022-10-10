import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { isCatalogTypeEnabled } from '@console/dev-console/src/utils/catalog-utils';
import { CatalogItem, ExtensionHook, SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import {
  FLAG_KNATIVE_EVENT_SINK_CATALOG_TYPE,
  FLAG_KNATIVE_EVENT_SOURCE_CATALOG_TYPE,
} from '../const';
import { useEventSourceModelsWithAccess } from '../hooks';
import { getEventSourceIcon } from '../utils/get-knative-icon';
import { getEventSourceCatalogProviderData } from './event-source-data';

const normalizeEventSources = (
  eventSources: K8sKind[],
  namespace: string,
  t: TFunction,
): CatalogItem[] => {
  const normalizedEventSources: CatalogItem[] = eventSources.map((eventSource) => {
    const { kind, label: name, id: uid } = eventSource;
    const href = `/catalog/ns/${namespace}/eventsource?sourceKind=${kind}`;
    const { description, provider, support } = getEventSourceCatalogProviderData(kind, t) ?? {};
    return {
      uid,
      name,
      description,
      icon: { url: getEventSourceIcon(referenceForModel(eventSource)) as string, class: null },
      type: 'EventSource',
      provider,
      cta: { label: t('knative-plugin~Create Event Source'), href },
      details: {
        properties: [
          {
            label: t('knative-plugin~Support'),
            value: support,
          },
        ],
      },
    };
  });
  return normalizedEventSources;
};

export const useEventSourceProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const { loaded, eventSourceModelsList: eventSourceModels } = useEventSourceModelsWithAccess(
    namespace,
  );
  const normalizedSources = React.useMemo(
    () => (loaded ? normalizeEventSources(eventSourceModels, namespace, t) : []),

    [loaded, namespace, t, eventSourceModels],
  );
  return [normalizedSources, loaded, undefined];
};

export const knativeEventingTypeProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_KNATIVE_EVENT_SOURCE_CATALOG_TYPE, isCatalogTypeEnabled('EventSource'));
  setFeatureFlag(FLAG_KNATIVE_EVENT_SINK_CATALOG_TYPE, isCatalogTypeEnabled('EventSink'));
};
