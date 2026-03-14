import type { FC } from 'react';
import { useState } from 'react';
import { Button, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import type { NodeKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { makeNodeUnschedulable } from '../../../k8s/requests/nodes';

type ConfigureUnschedulableModalProps = {
  resource: NodeKind;
} & ModalComponentProps;

const ConfigureUnschedulableModal: FC<ConfigureUnschedulableModalProps> = ({
  resource,
  close,
  cancel,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (): void => {
    handlePromise(makeNodeUnschedulable(resource))
      .then(() => close())
      // Errors are surfaced by usePromiseHandler/ModalFooterWithAlerts
      .catch(() => {});
  };
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader
        title={t('console-app~Mark as unschedulable')}
        labelId="configure-unschedulable-modal-title"
      />
      <ModalBody>
        <p>
          {t(
            "console-app~Unschedulable nodes won't accept new pods. This is useful for scheduling maintenance or preparing to decommission a node.",
          )}
        </p>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          isLoading={inProgress}
          isDisabled={inProgress}
        >
          {t('console-app~Mark unschedulable')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ConfigureUnschedulableModalOverlay: OverlayComponent<ConfigureUnschedulableModalProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="configure-unschedulable-modal-title"
    >
      <ConfigureUnschedulableModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
