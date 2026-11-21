import * as i18next from 'i18next';
import type {
  K8sResourceCommon,
  K8sResourceCondition,
  MachineAWSPlacement,
  MachineKind,
  MachineSetKind,
  MachineDeploymentKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s';
import { getName } from './common';

export const isClusterAPIResource = (obj: K8sResourceCommon): boolean =>
  obj?.apiVersion?.startsWith('cluster.x-k8s.io/') ?? false;

/** Machine API uses providerStatus.conditions; Cluster API uses status.conditions. */
export const getMachineConditions = (obj: MachineKind): K8sResourceCondition[] | undefined => {
  if (isClusterAPIResource(obj)) {
    return obj?.status?.conditions;
  }
  return obj?.status?.providerStatus?.conditions;
};

/** Pick a Machine owned by a MachineSet: same API group, namespace, and label selector. */
export const findMachineForMachineSet = (
  machineSet: MachineSetKind,
  machines: MachineKind[] = [],
): MachineKind | undefined => {
  if (!machineSet?.metadata?.namespace || !machineSet?.spec?.selector) {
    return undefined;
  }
  return machines.find(
    (m) =>
      !!m?.metadata?.namespace &&
      isClusterAPIResource(m) === isClusterAPIResource(machineSet) &&
      m.metadata.namespace === machineSet.metadata.namespace &&
      new LabelSelector(machineSet.spec.selector).matches(m),
  );
};

export const getMachineRole = (
  obj: MachineKind | MachineSetKind | MachineDeploymentKind,
): string => {
  const labels = obj?.metadata?.labels;
  if (!labels) {
    return undefined;
  }
  return (
    labels['machine.openshift.io/cluster-api-machine-role'] ||
    labels['cluster.x-k8s.io/role'] ||
    Object.keys(labels)
      .find((key) => key.startsWith('node-role.kubernetes.io/'))
      ?.replace('node-role.kubernetes.io/', '')
  );
};

export const getMachineInstanceType = (obj: MachineKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/instance-type'] ||
  obj?.metadata?.labels?.['node.kubernetes.io/instance-type'];

export const getMachineRegion = (obj: MachineKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/region'] ||
  obj?.metadata?.labels?.['topology.kubernetes.io/region'];

export const getMachineZone = (obj: MachineKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/zone'] ||
  obj?.metadata?.labels?.['topology.kubernetes.io/zone'];

// Machine sets don't have the region and zone labels. Use `providerSpec` if set.
export const getMachineAWSPlacement = (
  machineSet: MachineSetKind | MachineDeploymentKind,
): MachineAWSPlacement => machineSet?.spec?.template?.spec?.providerSpec?.value?.placement || {};

export const getMachineNodeName = (obj: MachineKind) => obj?.status?.nodeRef?.name;

export const getMachineNode = (machine: MachineKind, nodes: NodeKind[] = []): NodeKind => {
  const nodeRef = machine?.status?.nodeRef;
  if (!nodeRef) {
    return undefined;
  }
  // Machine API includes uid; Cluster API v1beta2 typically only sets name.
  if (nodeRef.uid) {
    return nodes.find((node) => !!node.metadata?.uid && node.metadata.uid === nodeRef.uid);
  }
  // Avoid matching two missing/empty names.
  if (!nodeRef.name) {
    return undefined;
  }
  return nodes.find((node) => getName(node) === nodeRef.name);
};

export const getMachineAddresses = (machine: MachineKind) => machine?.status?.addresses;

export const getMachinePhase = (obj: MachineKind): string => {
  const phase = obj?.status?.phase;
  return phase === 'Running' ? i18next.t('console-shared~Provisioned as node') : phase;
};
