import * as React from 'react';
import { Button, Modal, ModalVariant, ModalFooter } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
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

export type StopNodeMaintenanceModalProps = {
  nodeMaintenance: K8sResourceKind;
  closeOverlay: () => void;
};

const StopNodeMaintenanceModal: React.FC<StopNodeMaintenanceModalProps> = ({
  nodeMaintenance,
  closeOverlay,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await k8sKill(getMaintenanceModel(nodeMaintenance), nodeMaintenance);
      closeOverlay();
    } catch (error) {
      // Error handling - could be logged to monitoring system in production
    } finally {
      setIsSubmitting(false);
    }
  };

  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const reasonLabel = reason ? `(${reason})` : '';
  const nodeName = getNodeMaintenanceNodeName(nodeMaintenance);

  return (
    <Modal
      variant={ModalVariant.small}
      title={t('metal3-plugin~Stop maintenance')}
      isOpen
      onClose={closeOverlay}
    >
      <Trans t={t} ns="metal3-plugin">
        Are you sure you want to stop maintenance <strong>{reasonLabel}</strong> on node{' '}
        <strong>{nodeName}</strong>?
      </Trans>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          {t('metal3-plugin~Stop maintenance')}
        </Button>
        <Button variant="secondary" onClick={closeOverlay}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useStopNodeMaintenanceModal = () => {
  const launchOverlay = useOverlay();
  return (nodeMaintenance: K8sResourceKind) => {
    launchOverlay(StopNodeMaintenanceModal, { nodeMaintenance });
  };
};

export default StopNodeMaintenanceModal;
