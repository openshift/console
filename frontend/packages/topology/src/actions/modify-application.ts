import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { editApplicationModal } from '@console/topology/src/components/modals';

export const getModifyApplicationAction = (
  kind: K8sKind,
  obj: K8sResourceKind,
  insertBefore?: string | string[],
): Action => {
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
  };
};
