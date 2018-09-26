import React from 'react';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sPatch } from '../../../module/k8s';

class StartStopVmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    const patch = [{
      op: 'replace',
      path: '/spec/running',
      value: this.props.start
    }];
    const promise = k8sPatch(this.props.kind, this.props.resource, patch);
    this.handlePromise(promise).then(this.props.close);
  }

  render () {
    const {resource} = this.props;
    const action = this.props.start? 'Start':'Stop';
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>{action} Virtual Machine</ModalTitle>
      <ModalBody>
        Are you sure you want to {action} <strong>{resource.metadata.name}</strong>
        <span> in namespace <strong>{resource.metadata.namespace}</strong>?</span>
      </ModalBody>
      <ModalSubmitFooter errorMessage="" inProgress={false} submitText={action} cancel={this._cancel} />
    </form>;
  }
}

export const startStopVmModal = createModalLauncher(StartStopVmModal);
