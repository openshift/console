import React from 'react';
import PropTypes from 'prop-types';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sPatch } from '../../module/okdk8s';

import { getPxeBootPatch } from 'kubevirt-web-ui-components';

class StartStopVmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    const vm = this.props.resource;

    const patch = [];

    // handle PXE boot
    if (this.props.start) {
      const pxePatch = getPxeBootPatch(vm);
      patch.push(...pxePatch);
    }

    patch.push({
      op: 'replace',
      path: '/spec/running',
      value: this.props.start
    });

    const promise = k8sPatch(this.props.kind, vm, patch);
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
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={action} cancel={this._cancel} />
    </form>;
  }
}

StartStopVmModal.propTypes = {
  start: PropTypes.bool.isRequired,
  kind: PropTypes.object.isRequired, /* object of model */
  resource: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired
};

export const startStopVmModal = createModalLauncher(StartStopVmModal);
