import type { FC } from 'react';
import { useState } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { k8sKill } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { PodDisruptionBudgetModel } from '../../../models';
import type { PodDisruptionBudgetKind } from '../types';

const DeletePDBModal: FC<DeletePDBModalProps> = ({ close, pdb, workloadName }) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const pdbName = pdb.metadata.name;

  const handleSubmit = () => {
    const promise = k8sKill(PodDisruptionBudgetModel, pdb)
      .then(() => {
        close();
      })
      .catch((error) => {
        const message =
          error?.message ||
          t('console-app~Unknown error removing PodDisruptionBudget {{pdbName}}.', {
            pdbName,
          });
        return Promise.reject(new Error(message));
      });
    return handlePromise(promise);
  };

  return (
    <>
      <ModalHeader
        title={t('console-app~Remove PodDisruptionBudget?')}
        titleIconVariant="warning"
        labelId="delete-pdb-modal-title"
      />
      <ModalBody>
        <Form
          id="delete-pdb-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
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
            !errorMessage && <LoadingInline />
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          form="delete-pdb-form"
          isLoading={inProgress}
          isDisabled={inProgress}
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

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="delete-pdb-modal-title"
    >
      <DeletePDBModal {...props} close={handleClose} />
    </Modal>
  ) : null;
};

export type DeletePDBModalProps = ModalComponentProps & {
  pdb: PodDisruptionBudgetKind;
  workloadName: string;
};
