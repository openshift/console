import React from 'react';

import {k8s} from '../../module/k8s';
import {createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter} from '../factory/modal';
import {PromiseComponent, SelectorInput} from '../utils';

class CreateNamespaceModal extends PromiseComponent {
  handleChange (e) {
    this.setState({value: e.target.value});
  }

  _submit(event) {
    event.preventDefault();

    const namespace = {
      metadata: {
        name: this.state.value,
        labels: SelectorInput.objectify(this.state.labels),
      },
    };
    const promise = k8s.namespaces.create(namespace);
    this.handlePromise(promise)
      .then(this.props.close);
  }

  onLabels (labels) {
    this.setState({labels});
  }

  render() {
    return <form onSubmit={this._submit.bind(this)} name="form" className="co-p-new-user-modal">
      <ModalTitle>Create New Namespace</ModalTitle>
      <ModalBody>
        <div>
          <label htmlFor="input-name" className="control-label">Name</label>
        </div>
        <div className="modal-body__field">
          <input type="text" className="form-control" onChange={this.handleChange.bind(this)} value={this.state.value || ''} autoFocus required />
        </div>
        <div>
          <label className="control-label">Labels</label>
        </div>
        <div className="modal-body__field">
          <SelectorInput labelClassName="co-text-namespace" onChange={this.onLabels.bind(this)} tags={[]} />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Create Namespace" cancel={this.props.cancel.bind(this)} />
    </form>;
  }
}

export const createNamespaceModal = createModalLauncher(CreateNamespaceModal);

