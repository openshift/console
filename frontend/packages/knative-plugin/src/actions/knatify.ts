import i18next from 'i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '../models';

export const hideKnatifyAction = (resource: K8sResourceKind): boolean => {
  const isWorkloadReady = resource.status?.conditions?.find(
    (cd) => cd.type === 'Available' && cd.status === 'True',
  );
  return resource.metadata?.ownerReferences?.length > 0 || !isWorkloadReady;
};

export const MakeServerless = (model: K8sKind, obj: K8sResourceKind): Action => {
  const kind = obj.kind || model.kind;
  const apiVersion = obj.apiVersion || `${model.apiGroup}/${model.apiVersion}`;
  return {
    id: 'make-serverless',
    label: i18next.t('knative-plugin~Make Serverless'),
    cta: {
      href: `/knatify/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${kind}&apiversion=${apiVersion}`,
    },
    insertBefore: 'edit-labels',
    accessReview: {
      group: ServiceModel.apiGroup,
      resource: ServiceModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'create',
    },
  };
};
