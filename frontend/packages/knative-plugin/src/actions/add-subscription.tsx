import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../models';

export const addSubscription = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  return {
    label: 'Add Subscription',
    href: `add/ns/${source.metadata.namespace}`,
    accessReview: {
      group: EventingSubscriptionModel.apiGroup,
      resource: EventingSubscriptionModel.plural,
      name: source.metadata.name,
      namespace: source.metadata.namespace,
      verb: 'create',
    },
  };
};
