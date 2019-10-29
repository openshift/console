import { Kebab, KebabOption, asAccessReview } from '@console/internal/components/utils';
import {
  MarkAsSchedulable,
  MarkAsUnschedulable,
} from '@console/app/src/components/nodes/menu-actions';
import { K8sKind, NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';
import { NodeMaintenanceModel } from '../../models';

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
    label: 'Start maintenance',
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
    label: 'Stop maintenance',
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
