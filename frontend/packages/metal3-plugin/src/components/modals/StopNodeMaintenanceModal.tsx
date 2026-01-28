import { Trans, useTranslation } from 'react-i18next';
import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import {
  NodeMaintenanceModel,
  NodeMaintenanceKubevirtBetaModel,
  NodeMaintenanceKubevirtAlphaModel,
} from '../../models';
import { getNodeMaintenanceReason, getNodeMaintenanceNodeName } from '../../selectors';

const getMaintenanceModel = (nodeMaintenance: K8sResourceKind) => {
  if (
    nodeMaintenance.apiVersion ===
    `${NodeMaintenanceModel.apiGroup}/${NodeMaintenanceModel.apiVersion}`
  ) {
    return NodeMaintenanceModel;
  }
  if (
    nodeMaintenance.apiVersion ===
    `${NodeMaintenanceKubevirtBetaModel.apiGroup}/${NodeMaintenanceKubevirtBetaModel.apiVersion}`
  ) {
    return NodeMaintenanceKubevirtBetaModel;
  }
  return NodeMaintenanceKubevirtAlphaModel;
};

export const useStopNodeMaintenanceModal = (nodeMaintenance: K8sResourceKind) => {
  const { t } = useTranslation();
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const reasonLabel = reason ? `(${reason})` : '';
  const nodeName = getNodeMaintenanceNodeName(nodeMaintenance);
  const stopNodeMaintenanceModalLauncher = useWarningModal({
    title: t('metal3-plugin~Stop maintenance'),
    children: (
      <Trans t={t} ns="metal3-plugin">
        Are you sure you want to stop maintenance <strong>{reasonLabel}</strong> on node{' '}
        <strong>{nodeName}</strong>?
      </Trans>
    ),
    confirmButtonLabel: t('metal3-plugin~Stop maintenance'),
    onConfirm: () => k8sKill(getMaintenanceModel(nodeMaintenance), nodeMaintenance),
  });
  return stopNodeMaintenanceModalLauncher;
};
