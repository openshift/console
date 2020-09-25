import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../models';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';

export const addSubscription = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  return {
    label: 'Add Subscription',
    callback: () =>
      addPubSubConnectionModal({
        source,
      }),
    accessReview: {
      group: EventingSubscriptionModel.apiGroup,
      resource: EventingSubscriptionModel.plural,
      name: source.metadata.name,
      namespace: source.metadata.namespace,
      verb: 'create',
    },
  };
};
