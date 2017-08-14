import * as React from 'react';

import {k8sKinds, k8sPatch} from '../../module/k8s';
import {createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter} from '../factory/modal';
import {PromiseComponent} from '../utils';

class UnscheduleNodeModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _submit(event) {
    event.preventDefault();

    const patch = [{ op: 'replace', path: '/spec/unschedulable', value: true }];
    this.handlePromise(
      k8sPatch(k8sKinds.Node, this.props.resource, patch)
    )
      .then(this.props.close)
      .catch((error) => {
        throw error;
      });
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Mark as unschedulable</ModalTitle>
      <ModalBody>
        Unschedulable nodes won&#39;t accept new pods. This is useful for scheduling maintenance or preparing to decommission a node.
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Mark Unschedulable" cancel={this._cancel} />
    </form>;
  }
}

UnscheduleNodeModal.propTypes = {
  resource: React.PropTypes.object.isRequired,
};

export const configureUnschedulableModal = createModalLauncher(UnscheduleNodeModal);
