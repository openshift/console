import { TFunction } from 'i18next';
import {
  MarkAsSchedulable,
  MarkAsUnschedulable,
  Delete,
} from '@console/app/src/components/nodes/menu-actions';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { Kebab, KebabOption, asAccessReview } from '@console/internal/components/utils';
import { CertificateSigningRequestModel } from '@console/internal/models';
import {
  K8sKind,
  NodeKind,
  K8sResourceKind,
  MachineKind,
  k8sUpdate,
} from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { findNodeMaintenance } from '../../selectors';
import { CertificateSigningRequestKind } from '../../types';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

type ActionArgs = {
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability?: boolean;
  maintenanceModel: K8sKind;
  t: TFunction;
};

export const SetNodeMaintenance = (
  kindObj: K8sKind,
  node: NodeKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, t }: ActionArgs,
): KebabOption => {
  const nodeName = getName(node);
  return {
    hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
    label: t('metal3-plugin~Start Maintenance'),
    callback: () => startNodeMaintenanceModal({ nodeName }),
  };
};

export const RemoveNodeMaintenance = (
  kindObj: K8sKind,
  node: NodeKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, maintenanceModel, t }: ActionArgs,
): KebabOption => {
  const nodeName = getName(node);
  return {
    hidden: !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance,
    label: t('metal3-plugin~Stop Maintenance'),
    callback: () => stopNodeMaintenanceModal(nodeMaintenance, t),
    accessReview: nodeMaintenance && asAccessReview(maintenanceModel, nodeMaintenance, 'delete'),
  };
};

const updateCSR = (
  csr: CertificateSigningRequestKind,
  type: 'Approved' | 'Denied',
): Promise<CertificateSigningRequestKind> => {
  const approved = {
    ...csr,
    status: {
      ...(csr.status || {}),
      conditions: [
        {
          lastUpdateTime: new Date().toISOString(),
          message: `This CSR was ${type.toLowerCase()} via OpenShift Console`,
          reason: 'OpenShiftConsoleCSRApprove',
          type,
        },
        ...(csr.status?.conditions || []),
      ],
    },
  };
  return k8sUpdate(CertificateSigningRequestModel, approved, null, null, {
    path: 'approval',
  });
};

export const approveCSR = (
  csr: CertificateSigningRequestKind,
): Promise<CertificateSigningRequestKind> => updateCSR(csr, 'Approved');

export const denyCSR = (
  csr: CertificateSigningRequestKind,
): Promise<CertificateSigningRequestKind> => updateCSR(csr, 'Denied');

export const ApproveServerCSR = (
  kindObj: K8sKind,
  node: NodeKind,
  resources: { csr: CertificateSigningRequestKind },
  { t }: ActionArgs,
): KebabOption => ({
  label: t('metal3-plugin~Approve Server CSR'),
  hidden: !resources?.csr,
  callback: () =>
    confirmModal({
      title: t('metal3-plugin~Approve Node Server CSR'),
      message: t('metal3-plugin~Are you sure you want to approve server CSR for {{name}}?', {
        name: node.metadata.name,
      }),
      cancel: () => {},
      close: () => {},
      executeFn: () => approveCSR(resources.csr),
      btnText: t('metal3-plugin~Approve'),
    }),
});

const { ModifyLabels, ModifyAnnotations, Edit } = Kebab.factory;
export const menuActions = [
  SetNodeMaintenance,
  RemoveNodeMaintenance,
  MarkAsSchedulable,
  MarkAsUnschedulable,
  ModifyLabels,
  ModifyAnnotations,
  Edit,
  ApproveServerCSR,
  Delete,
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
  { hasNodeMaintenanceCapability, maintenanceModel, t },
) => {
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, getName(node));
  return menuActions.map((action) => {
    return action(kindObj, node, null, {
      hasNodeMaintenanceCapability,
      nodeMaintenance,
      maintenanceModel,
      t,
    });
  });
};
