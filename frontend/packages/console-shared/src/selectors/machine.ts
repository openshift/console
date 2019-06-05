import * as _ from 'lodash-es';

import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from './common';

export const getMachineRole = (machine) =>
  _.get(machine, ['metadata', 'labels', 'machine.openshift.io/cluster-api-machine-role']);
export const getMachineNodeName = (machine) => _.get(machine, 'status.nodeRef.name');

export const getMachineNode = (machine: K8sResourceKind, nodes: K8sResourceKind[]) =>
  nodes.find((node) => getMachineNodeName(machine) === getName(node));
