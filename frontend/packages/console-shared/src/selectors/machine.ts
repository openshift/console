import {
  MachineAWSPlacement,
  MachineKind,
  MachineSetKind,
  MachineDeploymentKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getName } from './common';

export const getMachineRole = (obj: MachineKind | MachineSetKind | MachineDeploymentKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/cluster-api-machine-role'];

export const getMachineInstanceType = (obj: MachineKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/instance-type'];

export const getMachineRegion = (obj: MachineKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/region'];

export const getMachineZone = (obj: MachineKind): string =>
  obj?.metadata?.labels?.['machine.openshift.io/zone'];

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
  return phase || 'Provisioned as node';
};
