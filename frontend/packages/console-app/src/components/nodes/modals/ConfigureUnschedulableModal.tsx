import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import type { NodeKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
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
      .catch(() => {});
  };
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={t('console-app~Mark as unschedulable')} />
      <ModalBody>
        <Form id="configure-unschedulable-form">
          {t(
            "console-app~Unschedulable nodes won't accept new pods. This is useful for scheduling maintenance or preparing to decommission a node.",
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          onClick={handleSubmit}
          form="configure-unschedulable-form"
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

  // Move focus away from the triggering element to prevent aria-hidden warning
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <ConfigureUnschedulableModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
