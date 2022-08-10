import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CatalogItem, ExtensionHook, useAccessReview } from '@console/dynamic-plugin-sdk';
import { KafkaSinkModel } from '../models';
import { getEventSourceIcon } from '../utils/get-knative-icon';
import { getEventSinkCatalogProviderData } from './event-sink-data';

const normalizeKafkaSink = (namespace: string, t: TFunction): CatalogItem[] => {
  const { kind, label } = KafkaSinkModel;
  const iconUrl = getEventSourceIcon(kind) as string;
  const href = `/catalog/ns/${namespace}/eventsink?sinkKind=${kind}`;
  const { description, provider, support } = getEventSinkCatalogProviderData(kind, t) ?? {};

  const normalizedKamelets = [
    {
      uid: kind,
      name: label,
      description,
      provider,
      cta: { label: t('knative-plugin~Create Event Sink'), href },
      type: 'EventSink',
      icon: { url: iconUrl },
      details: {
        properties: [
          {
            label: t('knative-plugin~Support'),
            value: support,
          },
        ],
      },
    },
  ];
  return normalizedKamelets;
};

const useKafkaSinkProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [canCreateKameletSink] = useAccessReview({
    group: KafkaSinkModel.apiGroup,
    resource: KafkaSinkModel.plural,
    verb: 'create',
    namespace,
  });

  const normalizedKafkaSink = React.useMemo(() => {
    if (!canCreateKameletSink) return [];
    return normalizeKafkaSink(namespace, t);
  }, [canCreateKameletSink, namespace, t]);
  return [normalizedKafkaSink, true, null];
};

export default useKafkaSinkProvider;
