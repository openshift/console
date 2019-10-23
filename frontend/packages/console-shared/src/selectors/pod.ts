import { PodKind } from '@console/internal/module/k8s';

export const getNodeName = (pod: PodKind): PodKind['spec']['nodeName'] =>
  pod && pod.spec ? pod.spec.nodeName : undefined;

export const getPodContainers = (pod: PodKind): PodKind['spec']['containers'] =>
  pod && pod.spec && pod.spec.containers ? pod.spec.containers : [];
export const getPodVolumes = (pod: PodKind): PodKind['spec']['volumes'] =>
  pod && pod.spec && pod.spec.volumes ? pod.spec.volumes : [];
