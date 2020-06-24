import * as React from 'react';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { VMIKind } from '../../../types';
import { VMIUsersAlert } from './vmi-users-alert';

export const ConfirmVMIModal = withHandlePromise((props: ConfirmVMIModalProps) => {
  const {
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
    vmi,
    title,
    message,
    executeFn,
    btnText,
    cancelText,
    alertTitle,
    submitDanger,
  } = props;

  const submit = (e) => {
    e.preventDefault();

    return handlePromise(executeFn()).then(close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>{title}</ModalTitle>
      <ModalBody>{message}</ModalBody>
      <VMIUsersAlert vmi={vmi} cancel={cancel} alertTitle={alertTitle} />
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={inProgress}
        inProgress={inProgress}
        submitText={btnText || 'Confirm'}
        submitDanger={submitDanger}
        cancel={cancel}
        cancelText={cancelText || 'Cancel'}
      />
    </form>
  );
});

export type ConfirmVMIModalProps = {
  vmi: VMIKind;
  message: React.ReactNode | string;
  title: React.ReactNode | string;
  executeFn: () => Promise<any>;
  btnText?: React.ReactNode | string;
  cancelText?: React.ReactNode | string;
  alertTitle?: string;
  submitDanger?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;

export const confirmVMIModal = createModalLauncher(ConfirmVMIModal);
