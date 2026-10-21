import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { CAMEL_K_PROVIDER_ANNOTATION, CAMEL_K_TYPE_LABEL } from '../const';
import { useKameletsData } from '../hooks/useKameletsData';
import { CamelKameletBindingModel } from '../models';
import { getEventSourceIcon } from '../utils/get-knative-icon';
import { getEventSourceSupport } from './utils';

const normalizeKamelets = (
  kamelets: K8sResourceKind[],
  namespace: string,
  t: TFunction,
): CatalogItem[] => {
  const normalizedKamelets = kamelets.map((k) => {
    const kind = k.kind || '';
    const uid = k.metadata?.uid || '';
    const name = k.metadata?.name || '';
    const annotations = k.metadata?.annotations;
    const { spec } = k;
    const creationTimestamp = k.metadata?.creationTimestamp;
    const provider = annotations?.[CAMEL_K_PROVIDER_ANNOTATION] || '';
    const iconUrl = getEventSourceIcon(kind, k);
    const href = `/catalog/ns/${namespace}/eventsource?sourceKind=${CamelKameletBindingModel.kind}&name=${name}`;
    return {
      uid,
      name: spec?.definition?.title || name,
      description: spec?.definition?.description || '',
      provider,
      creationTimestamp: creationTimestamp || undefined,
      cta: { label: t('knative-plugin~Create Event Source'), href },
      type: 'EventSource',
      icon: { url: typeof iconUrl === 'string' ? iconUrl : '' },
      details: {
        properties: [
          {
            label: t('knative-plugin~Support'),
            value: getEventSourceSupport(k),
          },
        ],
      },
    };
  });
  return normalizedKamelets;
};

const useKameletsProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const canCreateKameletBinding = useAccessReview({
    group: CamelKameletBindingModel.apiGroup,
    resource: CamelKameletBindingModel.plural,
    verb: 'create',
    namespace,
  });
  const [kamelets, kameletsLoaded, kameletsLoadError] = useKameletsData(namespace);

  const normalizedSource = useMemo(() => {
    if (!kameletsLoaded || !canCreateKameletBinding) return [];
    const kameletSource = kamelets.filter(
      (k) => k.metadata?.labels?.[CAMEL_K_TYPE_LABEL] === 'source',
    );
    return normalizeKamelets(kameletSource, namespace, t);
  }, [kameletsLoaded, kamelets, namespace, canCreateKameletBinding, t]);
  return [normalizedSource, kameletsLoaded, kameletsLoadError];
};

export default useKameletsProvider;
