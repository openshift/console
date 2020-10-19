import * as React from 'react';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { NodeMaintenanceModel, NodeMaintenanceOldModel } from '../../models';
import { getNodeMaintenanceReason, getNodeMaintenanceNodeName } from '../../selectors';

const stopNodeMaintenanceModal = (nodeMaintenance: K8sResourceKind) => {
  const title = 'Stop maintenance';
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const nodeName = getNodeMaintenanceNodeName(nodeMaintenance);
  return confirmModal({
    title,
    message: (
      <>
        Are you sure you want to stop maintenance <strong>{reason ? ` (${reason}) ` : ''}</strong>on
        node <strong>{nodeName}</strong>?
      </>
    ),
    btnText: title,
    executeFn: () =>
      k8sKill(
        nodeMaintenance.apiVersion.includes(NodeMaintenanceModel.apiGroup)
          ? NodeMaintenanceModel
          : NodeMaintenanceOldModel,
        nodeMaintenance,
      ),
  });
};

export default stopNodeMaintenanceModal;
