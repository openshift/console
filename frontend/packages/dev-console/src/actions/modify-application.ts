import { KebabOption } from '@console/internal/components/utils';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { editApplicationModal, editApplication } from '../components/modals';

export const ModifyApplication = (kind: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'Edit Application Grouping',
    callback: () =>
      editApplicationModal({
        resourceKind: kind,
        resource: obj,
        blocking: true,
        initialApplication: '',
      }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  };
};

export const EditApplication = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'Edit Application',
    callback: () => editApplication({ editAppResource: obj }),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
