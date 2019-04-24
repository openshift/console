import * as React from 'react';
import * as PropTypes from 'prop-types';
import { getName, FormFactory, settingsValue } from 'kubevirt-web-ui-components';

import { k8sCreate } from '../../module/okdk8s';
import { NodeMaintenance } from '../../models';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '../factory/okdfactory';
import { PromiseComponent } from '../utils/okdutils';

const getNodeMaintenance = (obj, reason) => (
  {
    kind: NodeMaintenance.kind,
    apiVersion: `${NodeMaintenance.apiGroup}/${NodeMaintenance.apiVersion}`,
    metadata: {
      name: `nodemaintenance-${getName(obj)}`,
    },
    spec: {
      nodeName: getName(obj),
      reason,
    },
  }
);

class StartMaintenanceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this.onFormChange = this._onFormChange.bind(this);
    this.state = {};
  }

  _submit(event) {
    event.preventDefault();

    const reason = settingsValue(this.state, 'reason');
    this.handlePromise(k8sCreate(NodeMaintenance, getNodeMaintenance(this.props.resource, reason)))
      .then(this.props.close)
      .catch(error => {
        throw error;
      });
  }

  _onFormChange(newValue, key) {
    this.setState({
      [key]: newValue,
    });
  }

  render() {
    const formFields = {
      reason: {
        id: 'maintenance-reason',
        title: 'Maintenance reason',
      },
    };

    return (
      <form onSubmit={this._submit} name="form" className="modal-content ">
        <ModalTitle>Start maintenance: {getName(this.props.resource)}</ModalTitle>
        <ModalBody>
          <p>
            All managed workloads will be moved off of this node. New workloads
            and data will not be added to this node until maintenance is
            stopped.
          </p>
          <FormFactory fields={formFields} fieldsValues={this.state} onFormChange={this.onFormChange} labelSize={4} controlSize={8} />
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText="Start Maintenance"
          cancel={this._cancel}
        />
      </form>
    );
  }
}

StartMaintenanceModal.propTypes = {
  resource: PropTypes.object.isRequired,
};

export const startMaintenanceModal = createModalLauncher(StartMaintenanceModal);
