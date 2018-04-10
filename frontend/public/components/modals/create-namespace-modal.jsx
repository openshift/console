import * as React from 'react';

import { k8sCreate, k8sKinds } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { history, PromiseComponent, SelectorInput } from '../utils';

const allow = 'allow';
const deny = 'deny';

const defaultDeny = {
  'apiVersion': 'networking.k8s.io/v1',
  'kind': 'NetworkPolicy',
  'spec': {
    'podSelector': null
  }
};

class CreateNamespaceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state.np = allow;
  }

  handleChange (e) {
    this.setState({name: e.target.value});
  }

  _submit(event) {
    event.preventDefault();

    const {name, labels} = this.state;
    const namespace = {
      metadata: {
        name,
        labels: SelectorInput.objectify(labels),
      },
    };
    let promise = k8sCreate(k8sKinds.Namespace, namespace);
    if (this.state.np === deny) {
      promise = promise.then(() => {
        const policy = Object.assign({}, defaultDeny, {metadata: {namespace: name, name: 'default-deny'}});
        return k8sCreate(k8sKinds.NetworkPolicy, policy);
      });
    }


    this.handlePromise(promise).then(() => {
      this.props.close();
      history.push(`namespaces/${name}`);
    });
  }

  onLabels (labels) {
    this.setState({labels});
  }

  render() {
    return <form onSubmit={this._submit.bind(this)} name="form" className="co-p-new-user-modal">
      <ModalTitle>Create New Namespace</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label htmlFor="input-name" className="control-label">Name</label>
          <div className="modal-body__field">
            <input type="text" className="form-control" onChange={this.handleChange.bind(this)} value={this.state.name || ''} autoFocus required />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label">Labels</label>
          <div className="modal-body__field">
            <SelectorInput labelClassName="co-text-namespace" onChange={this.onLabels.bind(this)} tags={[]} />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label">Default Network Policy</label>
          <div className="modal-body__field ">
            <select onChange={e => this.setState({np: e.target.value})} value={this.state.np} className="form-control">
              <option value={allow}>No restrictions (default)</option>
              <option value={deny}>Deny all inbound traffic.</option>
            </select>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Create Namespace" cancel={this.props.cancel.bind(this)} />
    </form>;
  }
}

export const createNamespaceModal = createModalLauncher(CreateNamespaceModal);
