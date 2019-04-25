import * as React from 'react';
import * as PropTypes from 'prop-types';
import { getName, getFormElement } from 'kubevirt-web-ui-components';

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
    this.onReasonChange = this._onReasonChange.bind(this);
    this.state = {};
  }

  _submit(event) {
    event.preventDefault();

    this.handlePromise(k8sCreate(NodeMaintenance, getNodeMaintenance(this.props.resource, this.state.reason)))
      .then(this.props.close)
      .catch(error => {
        throw error;
      });
  }

  _onReasonChange(newValue) {
    this.setState({
      reason: newValue,
    });
  }

  render() {
    const textField = {
      id: 'maintenance-reason',
      onChange: this.onReasonChange,
      isControlled: true,
      value: this.state.reason,
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
          <b>Maintenance reason</b>
          {getFormElement(textField)}
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
