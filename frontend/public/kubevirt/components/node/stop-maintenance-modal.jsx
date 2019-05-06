import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'patternfly-react';
import { getName } from 'kubevirt-web-ui-components';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sKill } from '../../module/okdk8s';
import { NodeMaintenance } from '../../models';

class StopMaintenanceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  setErrorMessage(error) {
    this.setState({ errorMessage: error.message });
  }

  submit(event) {
    event.preventDefault();

    const killPromise = k8sKill(NodeMaintenance, this.props.nodeMaintenance);
    this.handlePromise(killPromise).then(this.props.close);
  }

  render() {
    const { node } = this.props;
    return <Form onSubmit={this._submit} className="modal-content">
      <ModalTitle>Stop node maintenance</ModalTitle>
      <ModalBody>
        Are you sure you want to stop <strong>{getName(node)}</strong> maintenance?
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={'Stop Maintenance'} cancel={this._cancel} />
    </Form>;
  }
}

StopMaintenanceModal.propTypes = {
  node: PropTypes.object.isRequired,
  nodeMaintenance: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired,
};

export const stopMaintenanceModal = createModalLauncher(StopMaintenanceModal);
