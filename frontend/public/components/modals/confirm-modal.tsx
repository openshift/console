import { Translation } from 'react-i18next';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import type { ReactNode, FormEvent, FC } from 'react';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '../factory/modal';

interface ConfirmModalProps extends ModalComponentProps {
  btnText?: string | ReactNode;
  btnTextKey?: string;
  cancelText?: string | ReactNode;
  cancelTextKey?: string;
  executeFn: (e?: FormEvent<EventTarget>, opts?: { supressNotifications: boolean }) => Promise<any>;
  message?: string | ReactNode;
  messageKey?: string;
  title?: string | ReactNode;
  titleKey?: string;
  submitDanger?: boolean;
}

const ConfirmModal: FC<ConfirmModalProps> = (props) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit = (event: FormEvent<HTMLFormElement>) => {
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
