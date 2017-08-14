import * as React from 'react';

import {createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter} from '../factory/modal';
import {PromiseComponent} from '../utils';

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
        supressNotifications: true
      })
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>{this.props.message}</ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={this.props.btnText || 'Confirm'} cancel={this._cancel} />
    </form>;
  }
}
ConfirmModal.propTypes = {
  btnText: React.PropTypes.node,
  cancel: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired,
  executeFn: React.PropTypes.func.isRequired,
  message: React.PropTypes.node,
  title: React.PropTypes.node.isRequired
};

export const confirmModal = createModalLauncher(ConfirmModal);
