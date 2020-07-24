import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { setSinkPubsubModal } from '../components/modals';

export const setSinkPubsub = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  return {
    label: `Move ${model.kind}`,
    callback: () =>
      setSinkPubsubModal({
        source,
      }),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: source.metadata.name,
      namespace: source.metadata.namespace,
      verb: 'update',
    },
  };
};
