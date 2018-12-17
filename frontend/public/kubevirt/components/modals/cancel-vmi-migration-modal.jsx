import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'patternfly-react';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sKill } from '../../module/okdk8s';
import { VirtualMachineInstanceMigrationModel } from '../../models';

class CancelVmiMigrationModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
    this._cancelMigration = this.cancelMigration.bind(this);
  }

  setErrorMessage(error) {
    this.setState({ errorMessage: error.message });
  }

  submit(event) {
    event.preventDefault();
    this._cancelMigration();
  }

  cancelMigration() {
    const killPromise = k8sKill(VirtualMachineInstanceMigrationModel, this.props.migration);
    this.handlePromise(killPromise).then(this.props.close);
  }


  render() {
    const {migration} = this.props;
    return <Form onSubmit={this._submit}>
      <ModalTitle>Cancel Virtual Machine Migration</ModalTitle>
      <ModalBody>
        Are you sure you want to cancel <strong>{migration.spec.vmiName}</strong> migration
        <span> in <strong>{migration.metadata.namespace}</strong> namespace?</span>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={'Cancel Migration'} cancel={this._cancel} />
    </Form>;
  }
}

CancelVmiMigrationModal.propTypes = {
  migration: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired,
};

export const cancelVmiMigrationModal = createModalLauncher(CancelVmiMigrationModal);
