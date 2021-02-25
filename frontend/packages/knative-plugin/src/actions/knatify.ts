import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '../models';

export const hideKnatifyAction = (resource: K8sResourceKind): boolean => {
  const isWorkloadReady = resource.status?.conditions?.find(
    (cd) => cd.type === 'Available' && cd.status === 'True',
  );
  return resource.metadata?.ownerReferences?.length > 0 || !isWorkloadReady;
};

export const setKnatify = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    // t('knative-plugin~Create Knative service')
    labelKey: 'knative-plugin~Create Knative service',
    hidden: hideKnatifyAction(obj),
    href: `/knatify/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${obj.kind ||
      model.kind}`,
    accessReview: {
      group: ServiceModel.apiGroup,
      resource: ServiceModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'create',
    },
  };
};
