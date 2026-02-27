import { useState } from 'react';
import type { FC } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type { HorizontalPodAutoscalerKind, K8sResourceCommon } from '@console/internal/module/k8s';
import { k8sKill } from '@console/internal/module/k8s';
import { usePromiseHandler } from '../../hooks/promise-handler';
import { ModalFooterWithAlerts } from '../modals/ModalFooterWithAlerts';
import { YellowExclamationTriangleIcon } from '../status';

type DeleteHPAModalProps = ModalComponentProps & {
  hpa: HorizontalPodAutoscalerKind;
  workload: K8sResourceCommon;
};

const DeleteHPAModal: FC<DeleteHPAModalProps> = ({ close, cancel, hpa, workload }) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const hpaName = hpa.metadata.name;
  const workloadName = workload.metadata.name;

  const handleSubmit = (e) => {
    e.preventDefault();
    return handlePromise(k8sKill(HorizontalPodAutoscalerModel, hpa)).then(() => {
      close();
    });
  };

  return (
    <>
      <ModalHeader
        title={
          <>
            <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
            {t('console-shared~Remove {{label}}?', { label: HorizontalPodAutoscalerModel.label })}
          </>
        }
      />
      <ModalBody>
        <Form id="delete-hpa-modal-form">
          {hpaName ? (
            <>
              <p>
                {t('console-shared~Are you sure you want to remove the {{hpaLabel}}', {
                  hpaLabel: HorizontalPodAutoscalerModel.label,
                })}{' '}
                <b>{hpaName}</b> {t('console-shared~from')} <b>{workloadName}</b>?
              </p>
              <p>
                {t(
                  'console-shared~The resources that are attached to the {{hpaLabel}} will be deleted.',
                  { hpaLabel: HorizontalPodAutoscalerModel.label },
                )}
              </p>
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
          onClick={handleSubmit}
          form="delete-hpa-modal-form"
          isLoading={inProgress}
          isDisabled={inProgress || !!errorMessage}
          data-test="confirm-action"
        >
          {t('console-shared~Remove')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-shared~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

type DeleteHPAModalOverlayProps = {
  hpa: HorizontalPodAutoscalerKind;
  workload: K8sResourceCommon;
};

export const DeleteHPAModalOverlay: OverlayComponent<DeleteHPAModalOverlayProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <DeleteHPAModal
        close={handleClose}
        cancel={handleClose}
        hpa={props.hpa}
        workload={props.workload}
      />
    </Modal>
  ) : null;
};

export default DeleteHPAModalOverlay;
