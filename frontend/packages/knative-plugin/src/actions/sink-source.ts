import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { setSinkSourceModal } from '../components/modals';
import { EventingSubscriptionModel } from '../models';

export const setSinkSource = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  const label = model.kind === EventingSubscriptionModel.kind ? `Move ${model.kind}` : 'Move Sink';
  return {
    label,
    callback: () =>
      setSinkSourceModal({
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
