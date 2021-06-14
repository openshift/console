import { KebabOption } from '@console/internal/components/utils';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared/src/constants';
import { editApplicationModal } from '@console/topology/src/components/modals';

export const ModifyApplication = (kind: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    // t('topology~Edit Application grouping')
    labelKey: 'topology~Edit Application grouping',
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
  const annotation = obj?.metadata?.annotations?.['openshift.io/generated-by'];
  const isFromDevfile = obj?.metadata?.annotations?.isFromDevfile;
  return {
    // t('topology~Edit {{applicationName}}')
    labelKey: 'topology~Edit {{applicationName}}',
    labelKind: {
      applicationName: truncateMiddle(obj.metadata.name, { length: RESOURCE_NAME_TRUNCATE_LENGTH }),
    },
    hidden: annotation !== 'OpenShiftWebConsole' || !!isFromDevfile,
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
