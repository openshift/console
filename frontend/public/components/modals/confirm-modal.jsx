import * as React from 'react';
import { Translation } from 'react-i18next';
import * as PropTypes from 'prop-types';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';

class ConfirmModal extends PromiseComponent {
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
ConfirmModal.propTypes = {
  btnText: PropTypes.node,
  btnTextKey: PropTypes.string,
  cancel: PropTypes.func.isRequired,
  cancelText: PropTypes.node,
  cancelTextKey: PropTypes.string,
  close: PropTypes.func.isRequired,
  executeFn: PropTypes.func.isRequired,
  message: PropTypes.node,
  messageKey: PropTypes.string,
  title: PropTypes.node,
  titleKey: PropTypes.string,
  submitDanger: PropTypes.bool,
};

export const confirmModal = createModalLauncher(ConfirmModal);
