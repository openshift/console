import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getNodeMaintenanceNodeName = (nodeMaintenance: K8sResourceKind): string =>
  _.get(nodeMaintenance, 'spec.nodeName');
export const getNodeMaintenanceReason = (nodeMaintenance: K8sResourceKind): string =>
  _.get(nodeMaintenance, 'spec.reason');
export const getNodeMaintenancePhase = (nodeMaintenance: K8sResourceKind): string =>
  _.get(nodeMaintenance, 'status.phase');
export const getNodeMaintenanceLastError = (nodeMaintenance: K8sResourceKind): string =>
  _.get(nodeMaintenance, 'status.lastError');
export const getNodeMaintenancePendingPods = (nodeMaintenance: K8sResourceKind): string[] =>
  _.get(nodeMaintenance, 'status.pendingPods', []);
export const getNodeMaintenanceProgressPercent = (nodeMaintenance: K8sResourceKind): number => {
  if (!nodeMaintenance.status) return 0;
  const pendingPods = _.get(nodeMaintenance, 'status.pendingPods', []);
  const evictionPods = _.get(nodeMaintenance, 'status.evictionPods', 0);
  if (evictionPods === 0) return 100;
  return (Math.max(evictionPods - pendingPods.length, 0) / evictionPods) * 100;
};
// TODO(jtomasek): Move this into console-dynamic-plugin-sdk/src/selectors/common.ts
export const getNodeMaintenanceCreationTimestamp = <A extends K8sResourceKind = K8sResourceKind>(
  value: A,
) => _.get(value, 'metadata.creationTimestamp') as K8sResourceKind['metadata']['creationTimestamp'];

export const findNodeMaintenance = (nodeMaintenances: K8sResourceKind[], nodeName: string) =>
  (nodeMaintenances || []).find(
    (nodeMaintenance) => getNodeMaintenanceNodeName(nodeMaintenance) === nodeName,
  );
