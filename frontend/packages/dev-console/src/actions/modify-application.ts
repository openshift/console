import { KebabOption } from '@console/internal/components/utils';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { editApplicationModal } from '../components/modals';

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
    label: `Edit ${truncateMiddle(obj.metadata.name)}`,
    href: `/edit?name=${obj.metadata.name}&kind=${obj.kind || model.kind}`,
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
