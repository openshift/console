import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk/src';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { k8sKill } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { PodDisruptionBudgetModel } from '../../../models';
import type { PodDisruptionBudgetKind } from '../types';

const DeletePDBModal: FC<DeletePDBModalProps> = ({ close, pdb, workloadName }) => {
  const [submitError, setSubmitError] = useState<string>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { t } = useTranslation();
  const pdbName = pdb.metadata.name;

  const handleSubmit = () => {
    setIsSubmitting(true);
    k8sKill(PodDisruptionBudgetModel, pdb)
      .then(() => {
        close();
      })
      .catch((error) => {
        setSubmitError(
          error?.message ||
            t('console-app~Unknown error removing PodDisruptionBudget {{pdbName}}.', {
              pdbName,
            }),
        );
      });
  };

  return (
    <>
      <ModalHeader
        title={
          <>
            <YellowExclamationTriangleIcon /> {t('console-app~Remove PodDisruptionBudget?')}
          </>
        }
      />
      <ModalBody>
        <Form id="delete-pdb-form">
          {pdbName ? (
            <>
              <p>
                <Trans t={t} ns="console-app">
                  Are you sure you want to remove the PodDisruptionBudget <b>{{ pdbName }}</b> from{' '}
                  <b>{{ workloadName }}</b>?
                </Trans>
              </p>
              <p>{t('console-app~The PodDisruptionBudget will be deleted.')}</p>
            </>
          ) : (
            !submitError && <LoadingInline />
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={submitError}>
        <Button
          type="submit"
          variant="danger"
          onClick={handleSubmit}
          form="delete-pdb-form"
          isLoading={isSubmitting}
          isDisabled={!!submitError || isSubmitting}
        >
          {t('console-app~Remove')}
        </Button>
        <Button variant="link" onClick={close}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const DeletePDBModalOverlay: OverlayComponent<DeletePDBModalProps> = (props) => {
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
      <DeletePDBModal {...props} close={handleClose} />
    </Modal>
  ) : null;
};

export type DeletePDBModalProps = ModalComponentProps & {
  pdb: PodDisruptionBudgetKind;
  workloadName: string;
};
