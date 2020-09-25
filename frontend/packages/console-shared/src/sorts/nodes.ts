import * as UIActions from '@console/internal/actions/ui';
import { NodeKind } from '@console/internal/module/k8s';
import { getNodeMachineName } from '../selectors/node';

export const nodeMemory = (node: NodeKind): number => {
  const used = UIActions.getNodeMetric(node, 'usedMemory');
  const total = UIActions.getNodeMetric(node, 'totalMemory');
  return total === 0 ? 0 : used / total;
};
export const nodeFS = (node: NodeKind): number => {
  const used = UIActions.getNodeMetric(node, 'usedStorage');
  const total = UIActions.getNodeMetric(node, 'totalStorage');
  return total === 0 ? 0 : used / total;
};
export const nodeCPU = (node: NodeKind): number => Number(UIActions.getNodeMetric(node, 'cpu'));
export const nodePods = (node: NodeKind): number => Number(UIActions.getNodeMetric(node, 'pods'));
export const nodeMachine = (node: NodeKind): string => getNodeMachineName(node);
export const nodeInstanceType = (node: NodeKind): string =>
  node.metadata.labels?.['beta.kubernetes.io/instance-type'];
export const nodeZone = (node: NodeKind): string =>
  node.metadata.labels?.['topology.kubernetes.io/zone'];
