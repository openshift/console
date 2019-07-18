import * as React from 'react';
import { asAccessReview, KebabOption } from '@console/internal/components/utils';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getMachineNodeName, getName } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals';
import { findNodeMaintenance, getHostMachine, getNodeMaintenanceReason } from '../selectors';
import { NodeMaintenanceModel } from '../models';
import { startNodeMaintenanceModal } from './modals/start-node-maintenance-modal';

type ActionArgs = {
  nodeName?: string;
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability: boolean;
};

export const SetNodeMaintanance = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
  label: 'Start Maintenance',
  callback: () => startNodeMaintenanceModal({ nodeName }),
});

export const RemoveNodeMaintanance = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => {
  const title = 'Stop Maintenance';
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  return {
    hidden: !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance,
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: (
          <>
            Are you sure you want to stop maintenance{' '}
            <strong>
              {getName(nodeMaintenance)}
              {reason ? ` (${reason})` : ''}
            </strong>{' '}
            on node <strong>{nodeName}</strong>?
          </>
        ),
        btnText: title,
        executeFn: () => k8sKill(NodeMaintenanceModel, nodeMaintenance),
      }),
    accessReview:
      nodeMaintenance && asAccessReview(NodeMaintenanceModel, nodeMaintenance, 'delete'),
  };
};

export const menuActions = [SetNodeMaintanance, RemoveNodeMaintanance];

export const menuActionsCreator = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  { machines, nodeMaintenances },
  { hasNodeMaintenanceCapability },
) => {
  const machine = getHostMachine(host, machines);
  const nodeName = getMachineNodeName(machine);
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);

  return menuActions.map((action) => {
    return action(kindObj, host, null, { hasNodeMaintenanceCapability, nodeMaintenance, nodeName });
  });
};
