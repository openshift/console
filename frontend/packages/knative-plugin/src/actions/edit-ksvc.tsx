import { KebabOption } from '@console/internal/components/utils';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared/src/constants';

export const EditKsvc = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    // t('knative-plugin~Edit {{applicationName}}')
    labelKey: 'topology~Edit {{applicationName}}',
    labelKind: {
      applicationName: truncateMiddle(obj.metadata.name, { length: RESOURCE_NAME_TRUNCATE_LENGTH }),
    },
    href: `/edit/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${obj.kind ||
      model.kind}`,
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
