import { K8sResourceKind } from '@console/internal/module/k8s';
import { VMKind } from '../../types';
import { getLabels } from '../selectors';

export const getServicePort = (
  service: K8sResourceKind,
  targetPort: number,
): { protocol: string; port: number; targetPort: number; nodePort?: number } =>
  service?.spec?.ports?.find((servicePort) => targetPort === servicePort.targetPort);

export const getServicesForVM = (services: K8sResourceKind[], vm: VMKind): K8sResourceKind[] => {
  const vmLabels = getLabels(vm?.spec?.template, {});

  return services.filter((service) => {
    const selectors = service?.spec?.selector || {};
    return Object.keys(selectors).every((key) => vmLabels[key] === selectors[key]);
  });
};
