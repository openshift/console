import i18next from 'i18next';
import type {
  MachineAWSPlacement,
  MachineKind,
  MachineSetKind,
  MachineDeploymentKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getName } from './common';

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

export const getMachineNode = (machine: MachineKind, nodes: NodeKind[] = []): NodeKind =>
  nodes.find((node) => getMachineNodeName(machine) === getName(node));

export const getMachineAddresses = (machine: MachineKind) => machine?.status?.addresses;

export const getMachinePhase = (obj: MachineKind): string => {
  const phase = obj?.status?.phase;
  return phase === 'Running' ? i18next.t('console-shared~Provisioned as node') : phase;
};
