import * as React from 'react';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import {
  ModalComponentProps,
  createModalLauncher,
  ModalTitle,
  ModalBody,
} from '@console/internal/components/factory';
import { ModalFooter } from '../modal/modal-footer';
import { PAUSED_VM_MODAL_MESSAGE } from '../../../strings/vm/messages';
import { VMIKind } from '../../../types';
import { unpauseVMI } from '../../../k8s/requests/vmi/actions';

const modalTitle = 'Edit pause state';

export const VMStatusModal = withHandlePromise(
  ({
    vmi,
    title = modalTitle,
    cancel,
    close,
    handlePromise,
    inProgress,
    errorMessage,
  }: VMStatusModalProps) => {
    const [showPatchError, setPatchError] = React.useState<boolean>(false);

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
        <ModalTitle>{title}</ModalTitle>
        <ModalBody>{PAUSED_VM_MODAL_MESSAGE}</ModalBody>
        <ModalFooter
          errorMessage={showPatchError && errorMessage}
          inProgress={inProgress}
          onSubmit={onSubmit}
          onCancel={() => cancel()}
          submitButtonText="Unpause"
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
