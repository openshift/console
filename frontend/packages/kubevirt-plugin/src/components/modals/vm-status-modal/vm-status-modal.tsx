import * as React from 'react';
import { Modal } from '@patternfly/react-core';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { ModalComponentProps } from '@console/internal/components/factory';
import { ModalFooter } from '../modal/modal-footer';
import { PAUSED_VM_MODAL_MESSAGE } from '../../../constants/vm';
import { VMIKind } from '../../../types';
import { unpauseVMI } from '../../../k8s/requests/vmi/actions';

const modalTitle = 'Edit pause state';

const VMStatusModal = withHandlePromise<VMStatusModalProps>(
  ({ vmi, isOpen, setOpen, title = modalTitle, handlePromise, inProgress, errorMessage }) => {
    const [showPatchError, setPatchError] = React.useState<boolean>(false);

    const onSubmit = async (event) => {
      event.preventDefault();

      const promise = unpauseVMI(vmi);
      handlePromise(promise)
        .then(() => setOpen(false))
        .catch(() => setPatchError(true));
    };

    const footer = (
      <ModalFooter
        errorMessage={showPatchError && errorMessage}
        inProgress={inProgress}
        onSubmit={onSubmit}
        onCancel={() => setOpen(false)}
        submitButtonText="Unpause"
      />
    );

    return (
      <Modal
        title={title}
        isOpen={isOpen}
        variant="small"
        onClose={() => setOpen(false)}
        footer={footer}
        
      >
        <div>{PAUSED_VM_MODAL_MESSAGE}</div>
      </Modal>
    );
  },
);

export type VMStatusModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmi: VMIKind;
    title?: string;
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  };

export default VMStatusModal;
