import * as React from 'react';
import { getResource, findNodeMaintenance, getNodeMaintenanceDeletion, IconAndText } from 'kubevirt-web-ui-components';

import { k8sKill, nodeStatus } from '../../module/okdk8s';
import { NodeMaintenance } from '../../models';
import { LoadingInline, StatusIcon } from '../utils/okdutils';
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
    hidden: !nodeMaintenance || getNodeMaintenanceDeletion(nodeMaintenance),
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
  const maintenanceText = getNodeMaintenanceDeletion(maintenance) ? 'Stopping maintenance' : 'Under maintenance';
  return maintenance ? <IconAndText icon="off" text={maintenanceText} /> : <StatusIcon status={nodeStatus(node)} />;
};
