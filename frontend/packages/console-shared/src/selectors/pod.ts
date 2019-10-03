import { PodKind } from '@console/internal/module/k8s';

export const getNodeName = (pod: PodKind): PodKind['spec']['nodeName'] =>
  pod && pod.spec ? pod.spec.nodeName : undefined;
export const podIpAddress = (pod: PodKind): PodKind['status']['podIP'] =>
  pod && pod.status ? pod.status.podIP : undefined;
