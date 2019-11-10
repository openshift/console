import * as _ from 'lodash';
import {
  MachineKind,
  MachineSetKind,
  MachineDeploymentKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getName } from './common';

export const getMachineRole = (obj: MachineKind | MachineSetKind | MachineDeploymentKind): string =>
  _.get(obj, ['metadata', 'labels', 'machine.openshift.io/cluster-api-machine-role']);

export const getMachineInstanceType = (obj: MachineKind): string =>
  _.get(obj, ['metadata', 'labels', 'machine.openshift.io/instance-type']);

export const getMachineRegion = (obj: MachineKind): string =>
  _.get(obj, ['metadata', 'labels', 'machine.openshift.io/region']);

export const getMachineZone = (obj: MachineKind): string =>
  _.get(obj, ['metadata', 'labels', 'machine.openshift.io/zone']);

export const getMachineNodeName = (obj: MachineKind) => _.get(obj, 'status.nodeRef.name');

export const getMachineNode = (machine: MachineKind, nodes: NodeKind[] = []): NodeKind =>
  nodes.find((node) => getMachineNodeName(machine) === getName(node));

export const getMachineAddresses = (machine: MachineKind) => _.get(machine, 'status.addresses', []);

export const getMachineInternalIP = (machine: MachineKind) => {
  const machineAddresses = getMachineAddresses(machine);
  return _.get(machineAddresses.find((addr) => addr.type === 'InternalIP'), 'address');
};
