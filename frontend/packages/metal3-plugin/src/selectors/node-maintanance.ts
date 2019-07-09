import * as _ from 'lodash';

import { K8sResourceKind } from '@console/internal/module/k8s';

export const getNodeMaintenanceNodeName = (nodeMaintenance: K8sResourceKind): string =>
  _.get(nodeMaintenance, 'spec.nodeName');

export const getNodeMaintenanceReason = (nodeMaintenance: K8sResourceKind): string =>
  _.get(nodeMaintenance, 'spec.reason');

export const findNodeMaintenance = (nodeMaintenances: K8sResourceKind[], nodeName: string) =>
  (nodeMaintenances || []).find(
    (nodeMaintenance) => getNodeMaintenanceNodeName(nodeMaintenance) === nodeName,
  );
