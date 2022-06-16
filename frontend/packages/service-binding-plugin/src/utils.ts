import { K8sResourceCondition } from '@console/internal/module/k8s';
import { ServiceBinding, ComputedServiceBindingStatus } from './types';

const expectedConditionTypes = ['CollectionReady', 'InjectionReady', 'Ready'];
const expectedConditionStatus = 'True';

export const getComputedServiceBindingStatus = (
  serviceBinding: ServiceBinding,
): ComputedServiceBindingStatus => {
  const conditions = serviceBinding?.status?.conditions || [];
  const isConnected =
    conditions.filter(
      (condition) =>
        expectedConditionTypes.includes(condition.type) &&
        condition.status === expectedConditionStatus,
    ).length === expectedConditionTypes.length;

  return isConnected ? ComputedServiceBindingStatus.CONNECTED : ComputedServiceBindingStatus.ERROR;
};

export const getFirstServiceBindingError = (
  serviceBinding: ServiceBinding,
): K8sResourceCondition | null => {
  const conditions = serviceBinding?.status?.conditions || [];
  const firstError = conditions.find(
    (condition) =>
      expectedConditionTypes.includes(condition.type) &&
      condition.status !== expectedConditionStatus,
  );
  return firstError || null;
};
