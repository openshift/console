import { K8sResourceKind } from '@console/internal/module/k8s';

export const getServicePort = (
  service: K8sResourceKind,
  targetPort: number,
): { protocol: string; port: number; targetPort: number; nodePort?: number } =>
  service?.spec?.ports?.find((servicePort) => targetPort === servicePort.targetPort);
