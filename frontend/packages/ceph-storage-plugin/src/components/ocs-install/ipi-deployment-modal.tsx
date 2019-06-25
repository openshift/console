import * as React from 'react';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import {
  PromiseComponent,
  PromiseComponentState,
} from '@console/internal/components/utils/promise-component';

class IPIDeployementModal extends PromiseComponent<ipiModalProps, PromiseComponentState> {
  state = {
    inProgress: false,
    errorMessage: '',
  };

  submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    this.setState({ inProgress: true, errorMessage: '' });
    // TODO: Call the API, once decided
    // this.handlePromise().then(this.props.close);
  };

  render() {
    return (
      <form
        onSubmit={this.submit}
        name="form"
        className="modal-content modal-content--no-inner-scroll"
      >
        <ModalTitle>Create OCS Service</ModalTitle>
        <ModalBody>
          3 new nodes and a AWS bucket will be created in order to create the OCS Service.
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText="Create"
          cancel={this.props.cancel}
          cancelText="Cancel"
        />
      </form>
    );
  }
}

export const ipiDeployementModal = createModalLauncher<ipiModalProps>(IPIDeployementModal);

export type ipiModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
};
