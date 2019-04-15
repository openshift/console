import * as React from 'react';
import * as PropTypes from 'prop-types';

import { makeNodeUnschedulable } from '../../../module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '../factory/okdfactory';
import { PromiseComponent } from '../utils/okdutils';

class StartMaintenanceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _submit(event) {
    event.preventDefault();

    this.handlePromise(makeNodeUnschedulable(this.props.resource))
      .then(this.props.close)
      .catch(error => {
        throw error;
      });
  }

  render() {
    return (
      <form onSubmit={this._submit} name="form" className="modal-content ">
        <ModalTitle>Start Maintenance</ModalTitle>
        <ModalBody>
          <p>
            All managed workloads will be moved off of this host. New workloads
            and data will not be added to this host until maintenance is
            stopped.
          </p>
          <p>
            If the host does not exit maintenance within{' '}
            <strong>30 minutes</strong>, the cluster will automatically rebuild
            the host&apos;s data using replicated copies
          </p>
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
