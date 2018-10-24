import React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sPatch, k8sUpdate } from '../../../module/k8s';
import { ANNOTATION_FIRST_BOOT } from 'kubevirt-web-ui-components';

class StartStopVmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    let promise;
    const vm = this.props.resource;

    // handle PXE boot
    const annotations = _.get(vm, 'metadata.annotations', {});
    if (this.props.start && annotations[ANNOTATION_FIRST_BOOT]) {
      if (annotations[ANNOTATION_FIRST_BOOT] === 'true'){
        annotations[ANNOTATION_FIRST_BOOT] = 'false';
      } else {
        // find bootable disk and change boot order
        const disks = _.get(vm, 'spec.template.spec.domain.devices.disks', []);
        const bootableDisk = disks.find(disk => disk.bootOrder === 2);
        if (bootableDisk) {
          bootableDisk.bootOrder = 1;
          const interfaces = _.get(vm, 'spec.template.spec.domain.devices.interfaces', []);
          const bootableInterface = interfaces.find(i => i.bootOrder === 1);
          bootableInterface.bootOrder = 2;
        }
      }
      vm.spec.running = true;
      promise = k8sUpdate(this.props.kind, vm);
    } else {
      const patch = [{
        op: 'replace',
        path: '/spec/running',
        value: this.props.start
      }];

      promise = k8sPatch(this.props.kind, vm, patch);
    }
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
      <ModalSubmitFooter errorMessage="" inProgress={false} submitText={action} cancel={this._cancel} />
    </form>;
  }
}

StartStopVmModal.propTypes = {
  start: PropTypes.bool.isRequired,
  kind: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired
};

export const startStopVmModal = createModalLauncher(StartStopVmModal);
