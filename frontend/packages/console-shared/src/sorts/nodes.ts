import type { SortByDirection } from '@patternfly/react-table';
import { isCSRResource } from '@console/app/src/components/nodes/csr';
import * as UIActions from '@console/internal/actions/ui';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import type { NodeCertificateSigningRequestKind, NodeKind } from '@console/internal/module/k8s';
import {
  getNodeUptime,
  getNodeMachineName,
  getNodeRoles,
  isNodeUnschedulable,
} from '../selectors/node';

const DEFAULT_CONTROL_PLANE_TAINT_KEYS = new Set([
  'node-role.kubernetes.io/control-plane',
  'node-role.kubernetes.io/master',
]);

const hasExtraBlockingTaint = (node: NodeKind): boolean =>
  node?.spec?.taints?.some(
    (taint) =>
      (taint.effect === 'NoSchedule' || taint.effect === 'NoExecute') &&
      !DEFAULT_CONTROL_PLANE_TAINT_KEYS.has(taint.key),
  ) ?? false;

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
export const nodeArch = (node: NodeKind): string => node?.status?.nodeInfo?.architecture;
export const nodePods = (node: NodeKind): number => Number(UIActions.getNodeMetric(node, 'pods'));
export const nodeMachine = (node: NodeKind): string => getNodeMachineName(node);
export const nodeInstanceType = (node: NodeKind): string =>
  node.metadata.labels?.['beta.kubernetes.io/instance-type'];
export const nodeZone = (node: NodeKind): string =>
  node.metadata.labels?.['topology.kubernetes.io/zone'];
export const nodeUptime = (node: NodeKind): string => getNodeUptime(node);

export const nodeReadiness = (node: NodeKind): string => {
  const readyStatus =
    node?.status?.conditions?.find((c) => c.type === 'Ready')?.status ?? 'Unknown';
  const unschedulable = isNodeUnschedulable(node) ? '1' : '0';
  const extraBlockingTaint = hasExtraBlockingTaint(node) ? '1' : '0';
  return `${readyStatus}|${unschedulable}|${extraBlockingTaint}`;
};

export const nodeRoles = (node: NodeKind) => {
  const roles = getNodeRoles(node);
  return roles.sort().join(', ');
};

export const sortWithCSRResource =
  <D>(getter: (obj: NodeKind) => D, csrDefaultValue: D) =>
  (data: (NodeKind | NodeCertificateSigningRequestKind)[], direction: SortByDirection) =>
    data.sort(
      sortResourceByValue<NodeKind>(direction, (obj) => {
        const val = isCSRResource(obj) ? csrDefaultValue : getter(obj);
        return val;
      }),
    );
