import { StatusCondition } from './rhoas-types';

export class ResourceConditionError extends Error {
  public conditionContext: StatusCondition[];

  public isTokenValid: boolean;

  public isGenericProblem: boolean;
}

export const getCondition = (request: any, name: string) => {
  if (request && request.status && request.status.conditions) {
    for (const condition of request.status.conditions) {
      if (condition.type === name) {
        return condition as StatusCondition;
      }
    }
  }
  return undefined;
};

export const getFinishedCondition = (request: any) => {
  return getCondition(request, 'Finished');
};

export const isSuccessfull = (request: any) => {
  const condition = getCondition(request, 'Finished');
  return condition && condition.status === 'True';
};
