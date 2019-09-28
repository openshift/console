import * as React from 'react';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { NodeMaintenanceModel } from '../../models';
import { getNodeMaintenanceReason } from '../../selectors';

const stopNodeMaintenanceModal = (nodeMaintenance: K8sResourceKind, hostName: string) => {
  const title = 'Stop maintenance';
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  return confirmModal({
    title,
    message: (
      <>
        Are you sure you want to stop maintenance <strong>{reason ? ` (${reason}) ` : ''}</strong>on
        host <strong>{hostName}</strong>?
      </>
    ),
    btnText: title,
    executeFn: () => k8sKill(NodeMaintenanceModel, nodeMaintenance),
  });
};

export default stopNodeMaintenanceModal;
