import * as React from 'react';
import { asAccessReview, KebabOption } from '@console/internal/components/utils';
import {
  k8sKill,
  K8sKind,
  K8sResourceKind,
  k8sPatch,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getMachineNode, getMachineNodeName, getName } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals';
import {
  findNodeMaintenance,
  getHostMachine,
  getNodeMaintenanceReason,
  isHostPoweredOn,
} from '../selectors';
import { BaremetalHostModel, NodeMaintenanceModel } from '../models';
import { getHostStatus } from '../utils/host-status';
import { startNodeMaintenanceModal } from './modals/start-node-maintenance-modal';
import { powerOffHostModal } from './modals/power-off-host-modal';

type ActionArgs = {
  nodeName?: string;
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability: boolean;
  status: string;
};

export const SetNodeMaintanance = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
  label: 'Start maintenance',
  callback: () => startNodeMaintenanceModal({ nodeName }),
});

export const RemoveNodeMaintanance = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => {
  const title = 'Stop maintenance';
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

export const PowerOn = (kindObj: K8sKind, host: K8sResourceKind): KebabOption => {
  const title = 'Power on';
  return {
    hidden: isHostPoweredOn(host),
    label: title,
    callback: () => {
      k8sPatch(BaremetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);
    },
    accessReview: host && asAccessReview(BaremetalHostModel, host, 'update'),
  };
};

export const PowerOff = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: null,
  { hasNodeMaintenanceCapability, nodeName, status }: ActionArgs,
) => ({
  hidden: !isHostPoweredOn(host),
  label: 'Shut down',
  callback: () => powerOffHostModal({ hasNodeMaintenanceCapability, host, nodeName, status }),
  accessReview: host && asAccessReview(BaremetalHostModel, host, 'update'),
});

export const menuActions = [SetNodeMaintanance, RemoveNodeMaintanance, PowerOn, PowerOff];

type ExtraResources = {
  machines: MachineKind[];
  nodes: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

export const menuActionsCreator = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  { machines, nodes, nodeMaintenances }: ExtraResources,
  { hasNodeMaintenanceCapability },
) => {
  const machine = getHostMachine(host, machines);
  const node = getMachineNode(machine, nodes);
  const nodeName = getMachineNodeName(machine);
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);
  const status = getHostStatus({ host, machine, node, nodeMaintenance });

  return menuActions.map((action) => {
    return action(kindObj, host, null, {
      hasNodeMaintenanceCapability,
      nodeMaintenance,
      nodeName,
      status: status.status,
    });
  });
};
