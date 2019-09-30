import { PodKind } from '@console/internal/module/k8s';

export const getNodeName = (pod: PodKind): PodKind['spec']['nodeName'] =>
  pod && pod.spec ? pod.spec.nodeName : undefined;
