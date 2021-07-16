import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { truncateMiddle } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared';

export const EditImportApplication = (kind: K8sKind, obj: K8sResourceKind): Action => ({
  id: 'edit-import-app',
  label: i18next.t('devconsole~Edit {{applicationName}}', {
    applicationName: truncateMiddle(obj.metadata.name, {
      length: RESOURCE_NAME_TRUNCATE_LENGTH,
    }),
  }),
  cta: {
    href: `/edit/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${obj.kind ||
      kind.kind}`,
  },
  insertAfter: 'edit-resource-limits',
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'update',
  },
});
