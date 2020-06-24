import * as UIActions from '@console/internal/actions/ui';
import { NodeKind } from '@console/internal/module/k8s';
import { convertToBaseValue } from '@console/internal/components/utils';

export const nodeMemory = (node: NodeKind): number => {
  const used = UIActions.getNodeMetric(node, 'usedMemory');
  const total = convertToBaseValue(node?.status?.allocatable?.memory);
  return used && total ? used / total : 0;
};
export const nodeFS = (node: NodeKind): number => {
  const used = UIActions.getNodeMetric(node, 'usedStorage');
  const total = UIActions.getNodeMetric(node, 'totalStorage');
  return used && total ? used / total : 0;
};
export const nodeCPU = (node: NodeKind): number => {
  const used = Number(UIActions.getNodeMetric(node, 'cpu'));
  const total = convertToBaseValue(node?.status?.allocatable?.cpu);
  return used && total ? used / total : 0;
};
export const nodePods = (node: NodeKind): number => Number(UIActions.getNodeMetric(node, 'pods'));
