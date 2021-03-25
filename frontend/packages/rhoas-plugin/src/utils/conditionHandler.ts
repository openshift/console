import { StatusCondition } from './rhoas-types';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getCondition = (request: K8sResourceKind, name: string) => {
  if (request && request.status && request.status.conditions) {
    for (const condition of request.status.conditions) {
      if (condition.type === name) {
        return condition as StatusCondition;
      }
    }
  }
  return undefined;
};

export const getFinishedCondition = (request: K8sResourceKind) => {
  return getCondition(request, 'Finished');
};

export const isResourceStatusSuccessfull = (request: K8sResourceKind) => {
  const condition = getCondition(request, 'Finished');
  return condition && condition.status === 'True';
};

export const isAcccesTokenSecretValid = (request: K8sResourceKind) => {
  return getCondition(request, 'AcccesTokenSecretValid')?.status === 'True';
};
