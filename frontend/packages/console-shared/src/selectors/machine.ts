import * as _ from 'lodash-es';

import {
  MachineKind,
  MachineSetKind,
  MachineDeploymentKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getName } from './common';

export const getMachineRole = (obj: MachineKind | MachineSetKind | MachineDeploymentKind) =>
  _.get(obj, ['metadata', 'labels', 'machine.openshift.io/cluster-api-machine-role']);
export const getMachineNodeName = (obj: MachineKind) => _.get(obj, 'status.nodeRef.name');
export const getMachineAWSPlacement = (machine: MachineKind) =>
  _.get(machine, 'spec.providerSpec.value.placement') || {};

export const getMachineNode = (machine: MachineKind, nodes: NodeKind[]) =>
  nodes.find((node) => getMachineNodeName(machine) === getName(node));
