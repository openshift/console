import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { CatalogItem } from '@console/plugin-sdk';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { CamelKameletBindingModel, CamelKameletModel } from '../models';
import { getEventSourceIcon } from '../utils/get-knative-icon';
import { CAMEL_K_PROVIDER_ANNOTATION } from '../const';

const normalizeKamelets = (
  kamelets: K8sResourceKind[],
  namespace: string,
  t: TFunction,
): CatalogItem[] => {
  const normalizedKamelets = kamelets.map((k) => {
    const {
      kind,
      metadata: { uid, name, creationTimestamp, annotations },
      spec: {
        definition: { title, description },
      },
    } = k;
    const provider = annotations?.[CAMEL_K_PROVIDER_ANNOTATION] || '';
    const iconUrl = getEventSourceIcon(kind, k);
    const href = `/catalog/ns/${namespace}/eventsource?sourceKind=${CamelKameletBindingModel.kind}&name=${name}`;
    return {
      uid,
      name: title,
      description,
      provider,
      creationTimestamp,
      cta: { label: t('knative-plugin~Create Event Source'), href },
      type: 'EventSource',
      icon: { url: iconUrl },
    };
  });
  return normalizedKamelets;
};

const useKameletsProvider = ({ namespace }): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const canCreateKameletBinding = useAccessReview({
    group: CamelKameletBindingModel.apiGroup,
    resource: CamelKameletBindingModel.plural,
    verb: 'create',
    namespace,
  });
  const resource: WatchK8sResource = React.useMemo(
    () => ({ kind: referenceForModel(CamelKameletModel), isList: true, namespace, optional: true }),
    [namespace],
  );
  const [kamelets, kameletsLoaded, kameletsLoadError] = useK8sWatchResource<K8sResourceKind[]>(
    resource,
  );
  const normalizedSource = React.useMemo(
    () =>
      kameletsLoaded && canCreateKameletBinding ? normalizeKamelets(kamelets, namespace, t) : [],
    [kameletsLoaded, kamelets, namespace, canCreateKameletBinding, t],
  );
  return [normalizedSource, kameletsLoaded, kameletsLoadError];
};

export default useKameletsProvider;
