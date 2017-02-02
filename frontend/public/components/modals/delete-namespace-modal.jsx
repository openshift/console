import React from 'react';

import {k8s} from '../../module/k8s';
import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';
import {PromiseComponent} from '../utils';

class DeleteNamespaceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state = {
      isTypedNsMatching: false
    };
    this._submit = this._submit.bind(this);
    this._close = this._close.bind(this);
    this._cancel = this._cancel.bind(this);
    this._matchTypedNamespace = this._matchTypedNamespace.bind(this);
  }

  _matchTypedNamespace(e) {
    this.setState({ isTypedNsMatching: e.target.value === this.props.resource.metadata.name });
  }

  _close() {
    this.props.close();
  }

  _cancel() {
    this.props.cancel();
  }

  _submit(event) {
    event.preventDefault();
    this.handlePromise(k8s.namespaces.delete(this.props.resource)).then(this._close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Delete Namespace</ModalTitle>
      <ModalBody>
        <p>
          This action cannot be undone. It will destroy all pods, services and other objects in the deleted namespace.
        </p>
        <p>Confirm deletion by typing <strong>{this.props.resource.metadata.name}</strong> below:</p>
        <input type="text" className="form-control" onKeyUp={this._matchTypedNamespace} placeholder="Enter name" autoFocus={true} />
      </ModalBody>
      <ModalFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
        <button type="submit" className="btn btn-primary" disabled={!this.state.isTypedNsMatching}>
          Delete Namespace
        </button>
        <button type="button" onClick={this._cancel} className="btn btn-link">
          Cancel
        </button>
      </ModalFooter>
    </form>;
  }
}

DeleteNamespaceModal.propTypes = {
  resource: React.PropTypes.object
};

export const deleteNamespaceModal = createModalLauncher(DeleteNamespaceModal);
