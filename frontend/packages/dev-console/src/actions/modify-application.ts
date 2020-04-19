import { KebabOption } from '@console/internal/components/utils';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import { K8sResourceKind, K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '../const';
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
  const annotation = obj?.metadata?.annotations?.['openshift.io/generated-by'];
  return {
    label: `Edit ${truncateMiddle(obj.metadata.name, { length: RESOURCE_NAME_TRUNCATE_LENGTH })}`,
    hidden: obj.kind !== KnativeServiceModel.kind && annotation !== 'OpenShiftWebConsole',
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

export const EditHealthCheck = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'Edit Health Checks',
    href: `/k8s/ns/${obj.metadata.namespace}/${
      model.kind === KnativeServiceModel.kind ? referenceForModel(KnativeServiceModel) : model.kind
    }/${obj.metadata.name}/containers/${
      obj?.spec?.template?.spec?.containers?.[0]?.name
    }/health-checks`,
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
