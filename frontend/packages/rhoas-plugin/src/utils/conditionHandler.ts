import { K8sResourceKind } from '@console/internal/module/k8s';
import { StatusCondition } from './rhoas-types';

export const getCondition = (request: K8sResourceKind, name: string) => {
  if (request?.status?.conditions) {
    return request.status.conditions.find((condition: StatusCondition) => condition.type === name);
  }
  return undefined;
};

export const getFinishedCondition = (request: K8sResourceKind) => getCondition(request, 'Finished');

export const isResourceStatusSuccessful = (request: K8sResourceKind) => {
  const condition = getCondition(request, 'Finished');
  return condition?.status === 'True';
};

export const isAccessTokenSecretValid = (request: K8sResourceKind) =>
  getCondition(request, 'AcccesTokenSecretValid')?.status === 'True';
