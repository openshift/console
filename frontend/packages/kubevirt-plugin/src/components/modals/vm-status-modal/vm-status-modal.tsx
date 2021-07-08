import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { unpauseVMI } from '../../../k8s/requests/vmi/actions';
import { VMIKind } from '../../../types';
import { ModalFooter } from '../modal/modal-footer';

export const VMStatusModal = withHandlePromise(
  ({
    vmi,
    title = null,
    cancel,
    close,
    handlePromise,
    inProgress,
    errorMessage,
  }: VMStatusModalProps) => {
    const { t } = useTranslation();
    const [showPatchError, setPatchError] = React.useState<boolean>(false);

    const modalTitle = title || t('kubevirt-plugin~Edit pause state');

    const onSubmit = async (event) => {
      event.preventDefault();

      handlePromise(
        unpauseVMI(vmi),
        () => close(),
        () => setPatchError(true),
      );
    };

    return (
      <div className="modal-content">
        <ModalTitle>{modalTitle}</ModalTitle>
        <ModalBody>
          {t(
            'kubevirt-plugin~This VM has been paused. If you wish to unpause it, please click the Unpause button below. For further details, please check with your system administrator.',
          )}
        </ModalBody>
        <ModalFooter
          errorMessage={showPatchError && errorMessage}
          inProgress={inProgress}
          onSubmit={onSubmit}
          onCancel={() => cancel()}
          submitButtonText={t('kubevirt-plugin~Unpause')}
        />
      </div>
    );
  },
);

export type VMStatusModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmi: VMIKind;
    title?: string;
  };

export const vmStatusModal = createModalLauncher(VMStatusModal);
