import i18next from 'i18next';
import { GetModifyApplicationAction } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { editApplicationModal } from '@console/topology/src/components/modals';

export const getModifyApplicationAction: GetModifyApplicationAction = (kind, obj, insertBefore) => {
  return {
    id: 'modify-application',
    label: i18next.t('topology~Edit application grouping'),
    insertBefore: insertBefore ?? 'edit-pod-count',
    cta: () =>
      editApplicationModal({
        resourceKind: kind,
        resource: obj,
        blocking: true,
        initialApplication: '',
      }),
    accessReview: {
      verb: 'patch',
      group: kind.apiGroup,
      resource: kind.plural,
      namespace: obj?.metadata?.namespace,
    },
  };
};
