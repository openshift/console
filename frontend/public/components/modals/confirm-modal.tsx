import { Translation } from 'react-i18next';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';

interface ConfirmModalProps {
  btnText: string | React.ReactNode;
  btnTextKey: string;
  cancel: () => void;
  cancelText: string | React.ReactNode;
  cancelTextKey: string;
  close: () => void;
  executeFn: (
    e?: React.FormEvent<EventTarget>,
    opts?: { supressNotifications: boolean },
  ) => Promise<any>;
  message: string | React.ReactNode;
  messageKey: string;
  title: string | React.ReactNode;
  titleKey: string;
  submitDanger: boolean;
}

interface ConfirmModalState {
  inProgress: boolean;
  errorMessage: string;
}

class ConfirmModal extends PromiseComponent<ConfirmModalProps, ConfirmModalState> {
  _cancel: () => void;

  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _submit(event) {
    event.preventDefault();

    this.handlePromise(
      this.props.executeFn(null, {
        supressNotifications: true,
      }),
    ).then(this.props.close);
  }

  render() {
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
    } = this.props;

    return (
      <Translation>
        {(t) => (
          <form onSubmit={this._submit} name="form" className="modal-content">
            <ModalTitle>{titleKey ? t(titleKey) : title}</ModalTitle>
            <ModalBody>{messageKey ? t(messageKey) : message}</ModalBody>
            <ModalSubmitFooter
              errorMessage={this.state.errorMessage}
              inProgress={this.state.inProgress}
              submitText={btnTextKey ? t(btnTextKey) : btnText || t('Confirm')}
              cancel={this._cancel}
              cancelText={cancelTextKey ? t(cancelTextKey) : cancelText || t('Cancel')}
              submitDanger={submitDanger}
            />
          </form>
        )}
      </Translation>
    );
  }
}

/** @deprecated use `useWarningModal` instead */
export const confirmModal = createModalLauncher(ConfirmModal);
