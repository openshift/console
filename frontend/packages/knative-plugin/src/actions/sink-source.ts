import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { setSinkSourceModal } from '../components/modals';

export const setSinkSource = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'Move Sink',
    callback: () =>
      setSinkSourceModal({
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
