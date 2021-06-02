import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
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
    const { description, provider } = getEventSourceCatalogProviderData(kind, t) ?? {};
    return {
      uid,
      name,
      description,
      icon: { url: getEventSourceIcon(referenceForModel(eventSource)), class: null },
      type: 'EventSource',
      provider,
      cta: { label: t('knative-plugin~Create Event Source'), href },
    };
  });
  return normalizedEventSources;
};

const useEventSourceProvider: ExtensionHook<CatalogItem[]> = ({
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

export default useEventSourceProvider;
