import * as React from 'react';
import * as PropTypes from 'prop-types';

import { k8sKill } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { history, PromiseComponent} from '../utils';

class DeleteNamespaceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state = Object.assign(this.state, {isTypedNsMatching: false});
    this._submit = this._submit.bind(this);
    this._close = props.close.bind(this);
    this._cancel = props.cancel.bind(this);
    this._matchTypedNamespace = this._matchTypedNamespace.bind(this);
  }

  _matchTypedNamespace(e) {
    this.setState({ isTypedNsMatching: e.target.value === this.props.resource.metadata.name });
  }

  _submit(event) {
    event.preventDefault();
    this.handlePromise(k8sKill(this.props.kind, this.props.resource)).then(() => {
      this._close();
      history.push(`/k8s/cluster/${this.props.kind.plural}`);
    });
  }

  render() {
    return <form onSubmit={this._submit} name="form" className="modal-content ">
      <ModalTitle>Delete {this.props.kind.label}</ModalTitle>
      <ModalBody className="modal-body">
        <div className="co-delete-modal">
          <span aria-hidden="true" className="co-delete-modal__icon pficon pficon-warning-triangle-o"></span>
          <div>
            <p>This action cannot be undone. It will destroy all pods, services and other objects in the deleted namespace.</p>
            <p>Confirm deletion by typing <strong>{this.props.resource.metadata.name}</strong> below:</p>
            <input type="text" className="form-control" onKeyUp={this._matchTypedNamespace} placeholder="Enter name" autoFocus={true} />
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter submitText="Delete" submitDisabled={!this.state.isTypedNsMatching} submitButtonClass="btn-danger" cancel={this._cancel} errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} />
    </form>;
  }
}

DeleteNamespaceModal.propTypes = {
  kind: PropTypes.object,
  resource: PropTypes.object,
};

export const deleteNamespaceModal = createModalLauncher(DeleteNamespaceModal);
