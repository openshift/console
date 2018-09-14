import * as _ from 'lodash-es';
import React from 'react';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sKill,k8sList } from '../../../module/k8s';
import { VirtualMachineInstanceModel } from '../../models';

class RestartVmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    const listPromise = k8sList(VirtualMachineInstanceModel, {ns: this.props.resource.metadata.namespace, labelSelector: {matchLabels: _.get(this.props.resource, 'spec.template.metadata.labels')}});
    this.handlePromise(listPromise).then(list => {
      const promise = k8sKill(VirtualMachineInstanceModel, list[0]);
      this.handlePromise(promise).then(this.props.close);
    });
  }

  render () {
    const {resource} = this.props;
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Restart Virtual Machine</ModalTitle>
      <ModalBody> Are you sure you want to restart <strong>{resource.metadata.name}</strong>
        <span> in namespace <strong>{resource.metadata.namespace}</strong>?</span>
      </ModalBody>
      <ModalSubmitFooter errorMessage="" inProgress={false} submitText="Restart" cancel={this._cancel} />
    </form>;
  }
}

export const restartVmModal = createModalLauncher(RestartVmModal);
