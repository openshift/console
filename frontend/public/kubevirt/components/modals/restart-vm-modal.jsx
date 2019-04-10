import React from 'react';
import PropTypes from 'prop-types';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sKill, k8sGet, k8sPatch } from '../../module/okdk8s';
import { VirtualMachineInstanceModel } from '../../models';
import { getPxeBootPatch } from 'kubevirt-web-ui-components';

class RestartVmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
    this._killVmi = this.killVmi.bind(this);
  }

  setErrorMessage(error) {
    this.setState({ errorMessage: error.message });
  }

  submit(event) {
    event.preventDefault();

    const pxePatch = getPxeBootPatch(this.props.resource);
    if (pxePatch.length > 0) {
      const pxePromise = k8sPatch(this.props.kind, this.props.resource, pxePatch);
      this.handlePromise(pxePromise).then(this._killVmi);
    } else {
      this._killVmi();
    }
  }

  killVmi() {
    const getVmiPromise = k8sGet(VirtualMachineInstanceModel, this.props.resource.metadata.name, this.props.resource.metadata.namespace);
    this.handlePromise(getVmiPromise).then(vmi => {
      const killPromise = k8sKill(VirtualMachineInstanceModel, vmi);
      this.handlePromise(killPromise).then(this.props.close);
    });
  }

  render() {
    const {resource} = this.props;
    return <form onSubmit={this._submit} name="form" className="modal-content">
      <ModalTitle>Restart Virtual Machine</ModalTitle>
      <ModalBody> Are you sure you want to restart <strong>{resource.metadata.name}</strong>
        <span> in namespace <strong>{resource.metadata.namespace}</strong>?</span>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Restart" cancel={this._cancel} />
    </form>;
  }
}

RestartVmModal.propTypes = {
  resource: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
};

export const restartVmModal = createModalLauncher(RestartVmModal);
