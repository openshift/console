import i18next from 'i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getEventSourceSupport = (item: K8sResourceKind) => {
  const supportLabel = item.metadata?.labels?.['camel.apache.org/kamelet.support.level'];
  switch (supportLabel) {
    case 'Preview': {
      return i18next.t('knative-plugin~Tech Preview');
    }
    case 'Supported': {
      return i18next.t('knative-plugin~Supported');
    }
    default: {
      return i18next.t('knative-plugin~Community');
    }
  }
};
