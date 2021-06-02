import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
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
    titleKey,
    message,
    messageKey,
    executeFn,
    btnText,
    btnTextKey,
    cancelText,
    cancelTextKey,
    alertTitle,
    alertTitleKey,
    submitDanger,
  } = props;
  const { t } = useTranslation();
  const submit = (e) => {
    e.preventDefault();

    return handlePromise(executeFn(), close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>{titleKey ? t(titleKey) : title}</ModalTitle>
      <ModalBody>{messageKey ? t(messageKey) : message}</ModalBody>
      <VMIUsersAlert
        vmi={vmi}
        cancel={cancel}
        alertTitle={alertTitleKey ? t(alertTitleKey) : alertTitle}
      />
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={inProgress}
        inProgress={inProgress}
        submitText={btnTextKey ? t(btnTextKey) : btnText || t('kubevirt-plugin~Confirm')}
        submitDanger={submitDanger}
        cancel={cancel}
        cancelText={cancelTextKey ? t(cancelTextKey) : cancelText || t('kubevirt-plugin~Cancel')}
      />
    </form>
  );
});

export type ConfirmVMIModalProps = {
  vmi: VMIKind;
  message?: React.ReactNode | string;
  messageKey?: string;
  title?: React.ReactNode | string;
  titleKey?: string;
  executeFn: () => Promise<any>;
  btnText?: React.ReactNode | string;
  btnTextKey?: string;
  cancelText?: React.ReactNode | string;
  cancelTextKey?: string;
  alertTitle?: string;
  alertTitleKey?: string;
  submitDanger?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;

export const confirmVMIModal = createModalLauncher(ConfirmVMIModal);
