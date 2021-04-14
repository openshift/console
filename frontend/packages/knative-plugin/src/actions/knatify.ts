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
  const kind = obj.kind || model.kind;
  const apiVersion = obj.apiVersion || `${model.apiGroup}/${model.apiVersion}`;
  return {
    // t('knative-plugin~Make Serverless')
    labelKey: 'knative-plugin~Make Serverless',
    hidden: hideKnatifyAction(obj),
    href: `/knatify/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${kind}&apiversion=${apiVersion}`,
    accessReview: {
      group: ServiceModel.apiGroup,
      resource: ServiceModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'create',
    },
  };
};
