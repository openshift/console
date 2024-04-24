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

export const getBrandingDetails = () => {
  let productName;
  switch (window.SERVER_FLAGS.branding) {
    case 'openshift':
      productName = 'Red Hat OpenShift';
      break;
    case 'ocp':
      productName = 'Red Hat OpenShift';
      break;
    case 'online':
      productName = 'Red Hat OpenShift Online';
      break;
    case 'dedicated':
      productName = 'Red Hat OpenShift Dedicated';
      break;
    case 'azure':
      productName = 'Azure Red Hat OpenShift';
      break;
    case 'rosa':
      productName = 'Red Hat OpenShift Service on AWS';
      break;
    default:
      productName = 'OKD';
  }
  if (window.SERVER_FLAGS.customProductName) {
    productName = window.SERVER_FLAGS.customProductName;
  }
  return { productName };
};
