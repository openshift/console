import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { editSinkUriModal } from '../components/modals';

export const editSinkUri = (
  model: K8sKind,
  source: K8sResourceKind,
  resources: K8sResourceKind[],
): KebabOption => {
  return {
    label: 'Edit URI',
    callback: () =>
      editSinkUriModal({
        source,
        eventSourceList: resources,
      }),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: resources[0].metadata.name,
      namespace: resources[0].metadata.namespace,
      verb: 'update',
    },
  };
};
