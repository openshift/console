import { Kebab, KebabOption, asAccessReview } from '@console/internal/components/utils';
import {
  MarkAsSchedulable,
  MarkAsUnschedulable,
} from '@console/app/src/components/nodes/menu-actions';
import { K8sKind, NodeKind, K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';
import { NodeMaintenanceModel } from '../../models';
import { findNodeMaintenance } from '../../selectors';

type ActionArgs = {
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability?: boolean;
};

export const SetNodeMaintenance = (
  kindObj: K8sKind,
  node: NodeKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance }: ActionArgs,
): KebabOption => {
  const nodeName = getName(node);
  return {
    hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
    label: 'Start Maintenance',
    callback: () => startNodeMaintenanceModal({ nodeName }),
  };
};

export const RemoveNodeMaintenance = (
  kindObj: K8sKind,
  node: NodeKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance }: ActionArgs,
): KebabOption => {
  const nodeName = getName(node);
  return {
    hidden: !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance,
    label: 'Stop Maintenance',
    callback: () => stopNodeMaintenanceModal(nodeMaintenance),
    accessReview:
      nodeMaintenance && asAccessReview(NodeMaintenanceModel, nodeMaintenance, 'delete'),
  };
};

const { ModifyLabels, ModifyAnnotations, Edit } = Kebab.factory;
export const menuActions = [
  SetNodeMaintenance,
  RemoveNodeMaintenance,
  MarkAsSchedulable,
  MarkAsUnschedulable,
  ModifyLabels,
  ModifyAnnotations,
  Edit,
];

type ExtraResources = {
  machines: MachineKind[];
  hosts: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

export const menuActionsCreator = (
  kindObj: K8sKind,
  node: NodeKind,
  { nodeMaintenances }: ExtraResources,
  { hasNodeMaintenanceCapability },
) => {
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, getName(node));
  return menuActions.map((action) => {
    return action(kindObj, node, null, {
      hasNodeMaintenanceCapability,
      nodeMaintenance,
    });
  });
};
