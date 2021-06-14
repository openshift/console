import { K8sResourceKind } from '@console/internal/module/k8s';
import { getLabels } from '@console/shared';
import { VMIKind } from '../../types';

export const getServicePort = (
  service: K8sResourceKind,
  targetPort: number,
): { protocol: string; port: number; targetPort: number; nodePort?: number } =>
  service?.spec?.ports?.find((servicePort) => targetPort === servicePort.targetPort);

export const getServicesForVmi = (services: K8sResourceKind[], vmi: VMIKind): K8sResourceKind[] => {
  const vmLabels = getLabels(vmi, {});
  return services.filter((service) => {
    const selectors = service?.spec?.selector || {};
    return Object.keys(selectors).every((key) => vmLabels[key] === selectors[key]);
  });
};
