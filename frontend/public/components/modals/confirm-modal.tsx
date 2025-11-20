import * as React from 'react';
import { Translation } from 'react-i18next';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';

interface ConfirmModalProps {
  btnText?: string | React.ReactNode;
  btnTextKey?: string;
  cancel?: () => void;
  cancelText?: string | React.ReactNode;
  cancelTextKey?: string;
  close?: () => void;
  executeFn: (
    e?: React.FormEvent<EventTarget>,
    opts?: { supressNotifications: boolean },
  ) => Promise<any>;
  message?: string | React.ReactNode;
  messageKey?: string;
  title?: string | React.ReactNode;
  titleKey?: string;
  submitDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = (props) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    handlePromise(
      props.executeFn(null, {
        supressNotifications: true,
      }),
    ).then(props.close);
  };

  const {
    title,
    titleKey,
    message,
    messageKey,
    btnText,
    btnTextKey,
    cancelText,
    cancelTextKey,
    submitDanger,
    cancel,
  } = props;

  return (
    <Translation>
      {(t) => (
        <form onSubmit={submit} name="form" className="modal-content">
          <ModalTitle>{titleKey ? t(titleKey) : title}</ModalTitle>
          <ModalBody>{messageKey ? t(messageKey) : message}</ModalBody>
          <ModalSubmitFooter
            errorMessage={errorMessage}
            inProgress={inProgress}
            submitText={btnTextKey ? t(btnTextKey) : btnText || t('Confirm')}
            cancel={cancel}
            cancelText={cancelTextKey ? t(cancelTextKey) : cancelText || t('Cancel')}
            submitDanger={submitDanger}
          />
        </form>
      )}
    </Translation>
  );
};

/** @deprecated use `useWarningModal` instead */
export const confirmModal = createModalLauncher(ConfirmModal);
