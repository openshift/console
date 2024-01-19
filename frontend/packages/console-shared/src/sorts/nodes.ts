import { SortByDirection } from '@patternfly/react-table';
import { isCSRResource } from '@console/app/src/components/nodes/csr';
import * as UIActions from '@console/internal/actions/ui';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { NodeCertificateSigningRequestKind, NodeKind } from '@console/internal/module/k8s';
import { getNodeUptime } from '@console/shared/src';
import { getNodeMachineName, getNodeRoles } from '../selectors/node';

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
export const nodeUptime = (node: NodeKind): string => getNodeUptime(node);

export const nodeReadiness = (node: NodeKind) => {
  const readiness = node?.status?.conditions?.find((c) => c.type === 'Ready');
  return readiness?.status;
};

export const nodeRoles = (node: NodeKind) => {
  const roles = getNodeRoles(node);
  return roles.sort().join(', ');
};

export const sortWithCSRResource = <D>(getter: (obj: NodeKind) => D, csrDefaultValue: D) => (
  data: (NodeKind | NodeCertificateSigningRequestKind)[],
  direction: SortByDirection,
) => {
  return data.sort(
    sortResourceByValue<NodeKind>(direction, (obj) => {
      const val = isCSRResource(obj) ? csrDefaultValue : getter(obj);
      return val;
    }),
  );
};
