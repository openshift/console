import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import type { K8sResourceKind, K8sResourceCommon } from '@console/internal/module/k8s';
import EventType from '../components/eventing/EventType';
import {
  EVENT_TYPE_NAME_PARAM,
  EVENT_TYPE_NAMESPACE_PARAM,
  SUBSCRIBE_PROVIDER_API_VERSION_PARAM,
  SUBSCRIBE_PROVIDER_KIND_PARAM,
  SUBSCRIBE_PROVIDER_NAME_PARAM,
} from '../const';
import { useEventTypesData } from '../hooks/useEventTypesData';
import { EventingEventTypeModel, EventingBrokerModel } from '../models';
import { getEventSourceIcon } from '../utils/get-knative-icon';

const normalizeEventType = (eventType: K8sResourceKind, t: TFunction): CatalogItem => {
  const { kind } = EventingEventTypeModel;
  const iconUrl = getEventSourceIcon(kind) as string;

  const uid = `${eventType.metadata.namespace}-${eventType.metadata.name}`;

  let provider: K8sResourceCommon = { metadata: {} };

  if (eventType.spec.hasOwnProperty('reference')) {
    provider.apiVersion = eventType.spec.reference.apiVersion;
    provider.kind = eventType.spec.reference.kind;

    if (eventType.spec.reference.hasOwnProperty('namespace')) {
      provider.metadata.namespace = eventType.spec.reference.namespace;
    } else {
      provider.metadata.namespace = eventType.metadata.namespace;
    }

    if (eventType.spec.reference.hasOwnProperty('name')) {
      provider.metadata.name = eventType.spec.reference.name;
    }
  } else if (eventType.spec.hasOwnProperty('broker')) {
    provider = {
      apiVersion: `${EventingBrokerModel.apiGroup}/${EventingBrokerModel.apiVersion}`,
      kind: EventingBrokerModel.kind,
      metadata: {
        namespace: eventType.metadata.namespace,
        name: eventType.spec.broker,
      },
    };
  }

  const params = new URLSearchParams();
  params.append(SUBSCRIBE_PROVIDER_API_VERSION_PARAM, provider.apiVersion);
  params.append(SUBSCRIBE_PROVIDER_KIND_PARAM, provider.kind);
  params.append(SUBSCRIBE_PROVIDER_NAME_PARAM, provider.metadata.name);
  params.append(EVENT_TYPE_NAMESPACE_PARAM, eventType.metadata.namespace);
  params.append(EVENT_TYPE_NAME_PARAM, eventType.metadata.name);

  const href = `/catalog/ns/${provider.metadata.namespace}/subscribe?${params.toString()}`;

  return {
    uid,
    /* Add type and provider so that users can filter on event type, and provider name and namespace */
    name: `${eventType.spec.type} (${provider.metadata.namespace}/${provider.metadata.name})`,
    description: eventType.spec.description,
    cta: { label: t('knative-plugin~Subscribe'), href },
    type: 'EventType',
    icon: { url: iconUrl },
    creationTimestamp: eventType.metadata.creationTimestamp,
    provider: `${provider.metadata.name}`,
    details: {
      descriptions: [{ value: <EventType eventType={eventType} /> }],
    },
    tags: [EventingEventTypeModel.kind],
  };
};

const useEventTypeProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [canGetEventType] = useAccessReview({
    group: EventingEventTypeModel.apiGroup,
    resource: EventingEventTypeModel.plural,
    verb: 'get',
    namespace,
  });
  const [canListEventType] = useAccessReview({
    group: EventingEventTypeModel.apiGroup,
    resource: EventingEventTypeModel.plural,
    verb: 'list',
    namespace,
  });
  const [canWatchEventType] = useAccessReview({
    group: EventingEventTypeModel.apiGroup,
    resource: EventingEventTypeModel.plural,
    verb: 'watch',
    namespace,
  });

  const [eventTypes, eventTypesLoaded, eventTypesLoadError] = useEventTypesData(namespace);

  const normalized = useMemo(() => {
    if (!eventTypesLoaded || !canGetEventType || !canListEventType || !canWatchEventType) return [];

    return eventTypes.map((et) => normalizeEventType(et, t));
  }, [eventTypesLoaded, eventTypes, canGetEventType, canListEventType, canWatchEventType, t]);
  return [normalized, eventTypesLoaded, eventTypesLoadError];
};

export default useEventTypeProvider;
