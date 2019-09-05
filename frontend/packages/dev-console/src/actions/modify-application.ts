import { KebabOption } from '@console/internal/components/utils';
import { editApplicationModal } from '../components/modals';

export const ModifyApplication = (kind, obj): KebabOption => {
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
