import * as React from 'react';
import { connect } from 'react-redux';
import { getResource, findNodeMaintenance, getDeletionTimestamp, NodeStatus } from 'kubevirt-web-ui-components';

import { nodeStatus } from '../../module/okdk8s';
import { NodeMaintenance } from '../../models';
import { LoadingInline, StatusIcon, Timestamp, ResourceKebab } from '../utils/okdutils';
import { startMaintenanceModal } from './node-maintenance-modal';
import { stopMaintenanceModal } from './stop-maintenance-modal';
import { WithResources } from '../utils/withResources';
import { DetailsPage } from '../factory/okdfactory';

const maintenanceResourceMap = {
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
    callback: () => stopMaintenanceModal({ nodeMaintenance, node: obj }),
  };
};

export const maintenanceActions = [StartMaintenanceAction, StopMaintenanceAction];

export const NodeStatusWithMaintenanceConnected = ({node}) => (
  <WithResources resourceMap={maintenanceResourceMap}>
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

const stateToProps = ({k8s}) => ({
  nodeMaintenanceExists: !!k8s.getIn(['RESOURCES', 'models', NodeMaintenance.kind]),
});

export const NodeDetailsPageWithMaintenance = connect(stateToProps)(({nodeMaintenanceExists, menuActions, ...rest}) => {
  const resources = nodeMaintenanceExists ? [getResource(NodeMaintenance)] : null;

  const maintenanceMenuActions = nodeMaintenanceExists ? [...menuActions, ...maintenanceActions] : menuActions;

  return (
    <DetailsPage
      {...rest}
      menuActions={maintenanceMenuActions}
      resources={resources}
    />
  );
});

const ConnectedNodeMaintenanceKebab = connect(stateToProps)(({nodeMaintenanceExists, actions, ...rest }) => {
  const maintenanceMenuActions = nodeMaintenanceExists ? [...actions, ...maintenanceActions] : actions;
  const resources = nodeMaintenanceExists ? [getResource(NodeMaintenance)] : [];

  return <ResourceKebab {...rest} actions={maintenanceMenuActions} resources={resources} />;
});

export const NodeMaintenanceKebab = props => <ConnectedNodeMaintenanceKebab {...props} />;
