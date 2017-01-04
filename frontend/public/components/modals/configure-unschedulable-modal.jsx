import React from 'react';

import {angulars} from '../react-wrapper';
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
    this._setRequestPromise(
      angulars.k8s.resource.patch(angulars.k8s.kinds.NODE, this.props.resource, patch)
    )
      .then(this.props.close)
      .catch((error) => {
        throw error;
      });
  }

  render() {
    return <form onSubmit={this._submit} name="form" role="form">
      <ModalTitle>Mark as unschedulable</ModalTitle>
      <ModalBody>
        Unschedulable nodes won&#39;t accept new pods. This is useful for scheduling maintenance or preparing to decommission a node.
      </ModalBody>
      <ModalSubmitFooter promise={this.requestPromise} errorFormatter="k8sApi" submitText="Mark Unschedulable" cancel={this._cancel} />
    </form>;
  }
}

UnscheduleNodeModal.propTypes = {
  resource: React.PropTypes.object.isRequired,
};

export const configureUnschedulableModal = createModalLauncher(UnscheduleNodeModal);
