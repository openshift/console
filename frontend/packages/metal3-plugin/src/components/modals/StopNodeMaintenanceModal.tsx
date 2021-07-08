import * as React from 'react';
import { TFunction } from 'i18next';
import { Trans } from 'react-i18next';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { NodeMaintenanceModel, NodeMaintenanceOldModel } from '../../models';
import { getNodeMaintenanceReason, getNodeMaintenanceNodeName } from '../../selectors';

const stopNodeMaintenanceModal = (nodeMaintenance: K8sResourceKind, t: TFunction) => {
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const reasonLabel = reason ? `(${reason})` : '';
  const nodeName = getNodeMaintenanceNodeName(nodeMaintenance);
  return confirmModal({
    title: t('metal3-plugin~Stop maintenance'),
    message: (
      <Trans t={t} ns="metal3-plugin">
        Are you sure you want to stop maintenance <strong>{reasonLabel}</strong> on node{' '}
        <strong>{nodeName}</strong>?
      </Trans>
    ),
    btnText: t('metal3-plugin~Stop maintenance'),
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
