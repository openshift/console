import * as React from 'react';
import { getResource, findNodeMaintenance, getDeletionTimestamp, NodeStatus } from 'kubevirt-web-ui-components';

import { k8sKill, nodeStatus } from '../../module/okdk8s';
import { NodeMaintenance } from '../../models';
import { LoadingInline, StatusIcon, Timestamp } from '../utils/okdutils';
import { startMaintenanceModal } from './node-maintenance-modal';
import { WithResources } from '../utils/withResources';

const statusResourceMap = {
  maintenances: {
    resource: getResource(NodeMaintenance),
  },
};

const StartMaintenanceAction = (kind, obj, actionArgs) => ({
  label: 'Start Maintenance',
  hidden: findNodeMaintenance(obj, actionArgs[NodeMaintenance.kind]),
  callback: () => startMaintenanceModal({ resource: obj }),
});

const StopMaintenanceAction = (kind, obj, actionArgs) => {
  const nodeMaintenance = findNodeMaintenance(obj, actionArgs[NodeMaintenance.kind]);
  return {
    label: 'Stop Maintenance',
    hidden: !nodeMaintenance || getDeletionTimestamp(nodeMaintenance),
    callback: () => k8sKill(NodeMaintenance, nodeMaintenance),
  };
};

export const maintenanceActions = [StartMaintenanceAction, StopMaintenanceAction];

export const NodeStatusWithMaintenanceConnected = ({node}) => (
  <WithResources resourceMap={statusResourceMap}>
    <NodeStatusWithMaintenance node={node} />
  </WithResources>
);

const NodeStatusWithMaintenance = ({node, maintenances}) => {
  if (!maintenances) {
    return <LoadingInline />;
  }
  const maintenance = findNodeMaintenance(node, maintenances);
  return maintenance ? <NodeStatus node={node} maintenances={maintenances} TimestampComponent={Timestamp} /> : <StatusIcon status={nodeStatus(node)} />;
};
