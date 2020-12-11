import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { setTrafficDistributionModal } from '../components/modals';

export const setTrafficDistribution = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    // t('knative-plugin~Set traffic distribution')
    labelKey: 'knative-plugin~Set traffic distribution',
    callback: () =>
      setTrafficDistributionModal({
        obj,
      }),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
