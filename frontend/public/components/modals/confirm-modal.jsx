import React from 'react';

import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';
import {PromiseComponent} from '../utils';

class ConfirmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _submit(event) {
    event.preventDefault();

    this._setRequestPromise(
      this.props.executeFn(null, {
        supressNotifications: true
      })
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form" role="form">
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>{this.props.message}</ModalBody>
      <ModalFooter promise={this.requestPromise} errorFormatter="k8sApi">
        <button type="submit" className="btn btn-primary">{this.props.btnText || 'Confirm'}</button>
        <button type="button" onClick={this._cancel} className="btn btn-link">Cancel</button>
      </ModalFooter>
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
