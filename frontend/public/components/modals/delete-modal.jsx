import * as _ from 'lodash-es';
import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, history, resourceListPathFromModel } from '../utils';
import { k8sKill } from '../../module/k8s/';

//Modal for resource deletion and allows cascading deletes if propagationPolicy is provided for the enum
class DeleteModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this.state = Object.assign(this.state, {
      isChecked: true
    });
  }

  _submit(event) {
    event.preventDefault();
    const {kind, resource} = this.props;

    //https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/
    const propagationPolicy = this.state.isChecked ? kind.propagationPolicy : 'Orphan';
    const json = propagationPolicy
      ? { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
      : null;

    this.handlePromise( k8sKill(kind, resource, {}, json)).then(() => {
      this.props.close();
      // If we are currently on the deleted resource's page, redirect to the resource list page
      const re = new RegExp(`/${resource.metadata.name}(/|$)`);
      if (re.test(window.location.pathname)) {
        const listPath = resourceListPathFromModel(kind, _.get(resource, 'metadata.namespace'));
        history.push(listPath);
      }
    });
  }

  _onChecked() {
    this.checked = !this.checked;
  }

  render() {
    const {kind, resource} = this.props;
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Delete {kind.label}</ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong>{resource.metadata.name}</strong>
        {_.has(resource.metadata, 'namespace') && <span> in namespace <strong>{resource.metadata.namespace}</strong>?</span>}
        {_.has(kind, 'propagationPolicy') && <div className="co-delete-modal-checkbox">
          <label className="co-delete-modal-checkbox-label">
            <input type="checkbox" onChange={() => this.setState({isChecked: !this.state.isChecked})} checked={!!this.state.isChecked} />
            &nbsp;&nbsp; <span>Delete dependent objects of this resource</span>
          </label>
        </div>}
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={this.props.btnText || 'Confirm'} cancel={this._cancel} />
    </form>;
  }
}

export const deleteModal = createModalLauncher(DeleteModal);
