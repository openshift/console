/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { getPxeBootPatch } from 'kubevirt-web-ui-components';

import { PromiseComponent } from '../../../../components/utils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter, ModalComponentProps } from '../../../../components/factory/modal';
import { k8sPatch, K8sKind, K8sResourceKind } from '../../../../module/k8s';

class StartStopVMModal extends PromiseComponent {
  readonly props: StartStopVMModalProps;
  readonly state: StartStopVMModalState;

  _submit = (event) => {
    event.preventDefault();
    const { resource: vm, start, kind, close } = this.props;
    const patch = [];

    // handle PXE boot
    if (start) {
      const pxePatch = getPxeBootPatch(vm);
      patch.push(...pxePatch);
    }

    patch.push({
      op: 'replace',
      path: '/spec/running',
      value: start,
    });

    const promise = k8sPatch(kind, vm, patch);
    this.handlePromise(promise).then(close);
  }

  render() {
    const { resource: vm, start, cancel } = this.props;
    const { errorMessage, inProgress } = this.state;
    const action = start ? 'Start' : 'Stop';
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>{action} Virtual Machine</ModalTitle>
      <ModalBody>
        <div>
          Are you sure you want to {action} <strong>{vm.metadata.name}</strong>
          {' '} in namespace <strong>{vm.metadata.namespace}</strong>?
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={errorMessage} inProgress={inProgress} submitText={action} cancel={cancel} />
    </form>;
  }
}

export const startStopVMModal = createModalLauncher(StartStopVMModal);

type StartStopVMModalProps = {
  start: boolean;
  kind: K8sKind;
  resource: K8sResourceKind;
} & ModalComponentProps;

type StartStopVMModalState = {
  inProgress: boolean;
  errorMessage: string;
};
